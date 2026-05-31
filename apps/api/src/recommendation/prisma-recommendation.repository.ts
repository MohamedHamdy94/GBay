import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IRecommendationRepository } from './recommendation.types';
import { InteractionType, RecommendationType, TrendingWindow } from './dto';

@Injectable()
export class PrismaRecommendationRepository implements IRecommendationRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async trackInteraction(data: { userId: string; listingId?: string; interaction: InteractionType; metadata?: any }) {
    await this.prisma.userInteraction.create({
      data: {
        userId: data.userId,
        listingId: data.listingId,
        interaction: data.interaction,
        metadata: data.metadata,
      },
    });
  }

  async getRecentInteractions(userId: string, limit: number) {
    return this.prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { listing: { include: { product: true } } },
    });
  }

  async upsertCache(data: { userId: string; productId: string; type: RecommendationType; score: number; reason?: string; expiresAt: Date }) {
    await this.prisma.recommendationCache.upsert({
      where: {
        userId_productId_type: {
          userId: data.userId,
          productId: data.productId,
          type: data.type,
        },
      },
      update: {
        score: data.score,
        reason: data.reason,
        expiresAt: data.expiresAt,
      },
      create: data,
    });
  }

  async getCachedRecommendations(userId: string, type: RecommendationType, limit: number) {
    const now = new Date();
    return this.prisma.recommendationCache.findMany({
      where: {
        userId,
        type,
        expiresAt: { gt: now },
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: { product: true },
    });
  }

  async updateProductSimilarity(pairs: { productId: string; similarProductId: string; score: number; reason?: string }[]) {
    // Using a transaction for batch update/create
    await this.prisma.$transaction(
      pairs.map((pair) =>
        this.prisma.productSimilarity.upsert({
          where: {
            productId_similarProductId: {
              productId: pair.productId,
              similarProductId: pair.similarProductId,
            },
          },
          update: {
            score: pair.score,
            reason: pair.reason,
          },
          create: pair,
        }),
      ),
    );
  }

  async updateTrendingProducts(data: { productId: string; viewCount: number; orderCount: number; score: number; window: TrendingWindow }[]) {
    await this.prisma.$transaction(
      data.map((item) =>
        this.prisma.trendingProduct.upsert({
          where: { productId: item.productId },
          update: {
            viewCount: item.viewCount,
            orderCount: item.orderCount,
            score: item.score,
            window: item.window,
          },
          create: item,
        }),
      ),
    );
  }

  async getSimilarProducts(productId: string, limit: number) {
    return this.prisma.productSimilarity.findMany({
      where: { productId },
      orderBy: { score: 'desc' },
      take: limit,
      include: { similarProduct: true },
    });
  }

  async getTrendingProducts(limit: number) {
    return this.prisma.trendingProduct.findMany({
      orderBy: { score: 'desc' },
      take: limit,
      include: { product: true },
    });
  }
}
