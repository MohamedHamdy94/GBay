import { Injectable, Inject } from '@nestjs/common';
import { SearchIndexService } from './search-index.service';
import { SearchFilters, SearchResult, SearchDocument } from './search.types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject(SearchIndexService)
    private readonly indexService: SearchIndexService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async search(filters: SearchFilters): Promise<SearchResult> {
    if (this.indexService.isEnabled) {
      try {
        return await this.searchMeilisearch(filters);
      } catch (error) {
        console.error('Meilisearch search failed, falling back to database:', error);
      }
    }
    return this.searchDatabase(filters);
  }

  private async searchMeilisearch(filters: SearchFilters): Promise<SearchResult> {
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const filterArray: string[] = [];
    if (filters.category) filterArray.push(`categoryId = ${filters.category}`);
    if (filters.type) filterArray.push(`type = ${filters.type}`);
    if (filters.condition) filterArray.push(`condition = ${filters.condition}`);
    if (filters.sellerId) filterArray.push(`sellerId = ${filters.sellerId}`);
    if (filters.status) filterArray.push(`status = ${filters.status}`);
    if (filters.minPrice !== undefined) filterArray.push(`priceCents >= ${filters.minPrice}`);
    if (filters.maxPrice !== undefined) filterArray.push(`priceCents <= ${filters.maxPrice}`);

    const sortArray: string[] = [];
    if (filters.sort === 'price_asc') sortArray.push('priceCents:asc');
    else if (filters.sort === 'price_desc') sortArray.push('priceCents:desc');
    else if (filters.sort === 'newest') sortArray.push('createdAt:desc');

    const result = await this.indexService.search(filters.q || '', {
      filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
      sort: sortArray.length > 0 ? sortArray : undefined,
      limit,
      offset,
    });

    return {
      hits: result.hits as any as SearchDocument[],
      total: result.estimatedTotalHits || 0,
      page,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
    };
  }

  private async searchDatabase(filters: SearchFilters): Promise<SearchResult> {
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const skip = (page - 1) * limit;

    const where: any = {
      status: filters.status || 'ACTIVE',
    };

    if (filters.q) {
      where.product = {
        translations: {
          some: {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { description: { contains: filters.q, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    if (filters.category) where.product = { ...where.product, categoryId: filters.category };
    if (filters.type) where.type = filters.type;
    if (filters.condition) where.product = { ...where.product, condition: filters.condition };
    if (filters.sellerId) where.sellerId = filters.sellerId;

    const minPrice = filters.minPrice !== undefined ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice !== undefined ? Number(filters.maxPrice) : undefined;

    if (minPrice !== undefined || maxPrice !== undefined) {
      if (where.type === 'BUY_NOW') {
        where.buyNowPriceCents = {
          gte: minPrice,
          lte: maxPrice,
        };
      } else if (where.type === 'AUCTION') {
        where.auction = {
          OR: [
            { currentHighestBidCents: { gte: minPrice, lte: maxPrice } },
            { currentHighestBidCents: null, startPriceCents: { gte: minPrice, lte: maxPrice } },
          ],
        };
      } else {
        // Both types
        where.OR = [
          {
            type: 'BUY_NOW',
            buyNowPriceCents: { gte: minPrice, lte: maxPrice },
          },
          {
            type: 'AUCTION',
            auction: {
              OR: [
                { currentHighestBidCents: { gte: minPrice, lte: maxPrice } },
                { currentHighestBidCents: null, startPriceCents: { gte: minPrice, lte: maxPrice } },
              ],
            },
          },
        ];
      }
    }

    const orderBy: any = {};
    if (filters.sort === 'price_asc') orderBy.buyNowPriceCents = 'asc';
    else if (filters.sort === 'price_desc') orderBy.buyNowPriceCents = 'desc';
    else if (filters.sort === 'newest') orderBy.createdAt = 'desc';
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          product: {
            include: {
              translations: true,
              category: { include: { translations: true } },
              seller: true,
              media: true,
            }
          },
          auction: true,
        },
        orderBy,
        take: limit,
        skip,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      hits: items.map(item => this.mapToSearchDocument(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapToSearchDocument(listing: any): SearchDocument {
    const enTrans = listing.product.translations.find((t: any) => t.locale === 'en');
    const deTrans = listing.product.translations.find((t: any) => t.locale === 'de');
    const enCat = listing.product.category?.translations.find((t: any) => t.locale === 'en');
    const deCat = listing.product.category?.translations.find((t: any) => t.locale === 'de');

    return {
      id: `listing-${listing.id}`,
      entityId: listing.id,
      type: listing.type === 'AUCTION' ? 'AUCTION' : 'PRODUCT',
      title: enTrans?.title || '',
      title_de: deTrans?.title || enTrans?.title || '',
      description: enTrans?.description || '',
      description_de: deTrans?.description || enTrans?.description || '',
      priceCents: listing.buyNowPriceCents || listing.auction?.currentHighestBidCents || listing.auction?.startPriceCents || 0,
      currency: listing.currency,
      categoryId: listing.product.categoryId || 'uncategorized',
      categoryName: enCat?.name || 'Uncategorized',
      categoryName_de: deCat?.name || enCat?.name || 'Nicht kategorisiert',
      condition: listing.product.condition,
      sellerId: listing.sellerId,
      sellerName: listing.product.seller.displayName,
      images: listing.product.media.map((m: any) => m.bucketKey),
      status: listing.status,
      auctionEndTime: listing.auction?.endTime?.toISOString(),
      auctionStartPrice: listing.auction?.startPriceCents,
      currentBid: listing.auction?.currentHighestBidCents,
      createdAt: listing.createdAt.toISOString(),
    };
  }

  async getSuggestions(q: string) {
    if (this.indexService.isEnabled) {
      const result = await this.indexService.search(q, {
        limit: 5,
        attributesToRetrieve: ['title', 'title_de'],
      });
      return result.hits;
    }
    // Database fallback for suggestions
    return this.prisma.productTranslation.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { title: true },
    });
  }
}
