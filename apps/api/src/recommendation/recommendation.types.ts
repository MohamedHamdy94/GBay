import { InteractionType, RecommendationType, TrendingWindow } from './dto';

export const RECOMMENDATION_REPOSITORY = 'RECOMMENDATION_REPOSITORY';

export interface IRecommendationRepository {
  trackInteraction(data: {
    userId: string;
    listingId?: string;
    interaction: InteractionType;
    metadata?: any;
  }): Promise<void>;

  getRecentInteractions(userId: string, limit: number): Promise<any[]>;

  upsertCache(data: {
    userId: string;
    productId: string;
    type: RecommendationType;
    score: number;
    reason?: string;
    expiresAt: Date;
  }): Promise<void>;

  getCachedRecommendations(
    userId: string,
    type: RecommendationType,
    limit: number,
  ): Promise<any[]>;

  updateProductSimilarity(
    pairs: {
      productId: string;
      similarProductId: string;
      score: number;
      reason?: string;
    }[],
  ): Promise<void>;

  updateTrendingProducts(
    data: {
      productId: string;
      viewCount: number;
      orderCount: number;
      score: number;
      window: TrendingWindow;
    }[],
  ): Promise<void>;

  getSimilarProducts(productId: string, limit: number): Promise<any[]>;

  getTrendingProducts(limit: number): Promise<any[]>;
}
