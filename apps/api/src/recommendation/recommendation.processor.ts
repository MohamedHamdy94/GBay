import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, IRecommendationRepository } from './recommendation.types';
import { PrismaService } from '../prisma.service';
import { TrendingWindow, RecommendationType } from './dto';

@Injectable()
export class RecommendationProcessor implements OnModuleInit {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: IRecommendationRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Optional: Start periodic refreshes
  }

  async computeTrending() {
    console.log('Computing trending products...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Get view counts from UserInteraction
    const views = await this.prisma.userInteraction.groupBy({
      by: ['listingId'],
      where: {
        interaction: 'VIEW',
        createdAt: { gte: twentyFourHoursAgo },
        listingId: { not: null },
      },
      _count: {
        listingId: true,
      },
    });

    // 2. Get order counts from OrderItem (orders created in last 24h)
    const orders = await this.prisma.orderItem.groupBy({
      by: ['listingId'],
      where: {
        order: {
          createdAt: { gte: twentyFourHoursAgo },
        },
        listingId: { not: null },
      },
      _count: {
        listingId: true,
      },
    });

    // 3. Combine and calculate scores
    const statsMap = new Map<string, { views: number; orders: number }>();

    views.forEach((v) => {
      if (v.listingId) {
        statsMap.set(v.listingId, { views: v._count.listingId, orders: 0 });
      }
    });

    orders.forEach((o) => {
      if (o.listingId) {
        const stats = statsMap.get(o.listingId) || { views: 0, orders: 0 };
        stats.orders = o._count.listingId;
        statsMap.set(o.listingId, stats);
      }
    });

    const trendingData = Array.from(statsMap.entries()).map(([listingId, stats]) => ({
      productId: listingId,
      viewCount: stats.views,
      orderCount: stats.orders,
      score: stats.views * 1 + stats.orders * 10,
      window: TrendingWindow.DAILY,
    }));

    // Filter for active listings only (optional but good practice)
    const activeListings = await this.prisma.listing.findMany({
      where: {
        id: { in: trendingData.map((d) => d.productId) },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const activeListingIds = new Set(activeListings.map((l) => l.id));
    const finalTrendingData = trendingData.filter((d) => activeListingIds.has(d.productId));

    // 4. Update trending products
    if (finalTrendingData.length > 0) {
      await this.repository.updateTrendingProducts(finalTrendingData);
    }
  }

  async computeSimilarities() {
    console.log('Computing product similarities...');
    const activeListings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { product: true },
    });

    for (const listing of activeListings) {
      if (!listing.product.categoryId || listing.buyNowPriceCents === null) continue;

      const minPrice = listing.buyNowPriceCents * 0.75;
      const maxPrice = listing.buyNowPriceCents * 1.25;

      const similarListings = await this.prisma.listing.findMany({
        where: {
          id: { not: listing.id },
          status: 'ACTIVE',
          buyNowPriceCents: {
            gte: Math.round(minPrice),
            lte: Math.round(maxPrice),
          },
          product: {
            categoryId: listing.product.categoryId,
            condition: listing.product.condition,
          },
        },
        take: 10,
        select: { id: true },
      });

      if (similarListings.length > 0) {
        const pairs = similarListings.map((similar) => ({
          productId: listing.id,
          similarProductId: similar.id,
          score: 1.0, // Basic similarity score
          reason: 'Same category, condition and similar price',
        }));

        await this.repository.updateProductSimilarity(pairs);
      }
    }
  }

  async computePersonalized(userId: string) {
    console.log(`Computing personalized recommendations for user ${userId}...`);

    // 1. Fetch last 30 interactions for the user
    const interactions = await this.repository.getRecentInteractions(userId, 30);
    if (interactions.length === 0) return;

    // 2. Extract top 3 categories and top 2 sellers
    const categoryCounts = new Map<string, number>();
    const sellerCounts = new Map<string, number>();
    const interactedListingIds = new Set<string>();

    interactions.forEach((inter) => {
      if (inter.listingId) interactedListingIds.add(inter.listingId);

      const categoryId = inter.listing?.product?.categoryId;
      if (categoryId) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
      }

      const sellerId = inter.listing?.product?.sellerId;
      if (sellerId) {
        sellerCounts.set(sellerId, (sellerCounts.get(sellerId) || 0) + 1);
      }
    });

    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const topSellers = Array.from(sellerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => id);

    // 3. Query active listings in those categories/sellers
    const recommendedListings = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        id: { notIn: Array.from(interactedListingIds) },
        OR: [{ product: { categoryId: { in: topCategories } } }, { product: { sellerId: { in: topSellers } } }],
      },
      take: 20,
      include: { product: true },
    });

    // 4. Score and Cache
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    for (const listing of recommendedListings) {
      let score = 0;
      let reason = '';

      if (listing.product.categoryId && topCategories.includes(listing.product.categoryId)) {
        score += 5;
        reason += 'Related to your favorite categories. ';
      }
      if (topSellers.includes(listing.product.sellerId)) {
        score += 3;
        reason += 'From a seller you follow or liked. ';
      }

      await this.repository.upsertCache({
        userId,
        productId: listing.id,
        type: RecommendationType.BASED_ON_HISTORY,
        score,
        reason: reason.trim(),
        expiresAt,
      });
    }
  }
}
