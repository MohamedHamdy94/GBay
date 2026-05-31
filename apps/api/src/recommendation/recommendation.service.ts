import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, IRecommendationRepository } from './recommendation.types';
import { RecommendationType, InteractionType } from './dto';
import { RecommendationProcessor } from './recommendation.processor';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: IRecommendationRepository,
    @Inject(forwardRef(() => RecommendationProcessor))
    private readonly processor: RecommendationProcessor,
  ) {}

  async getRecommendations(type: RecommendationType, userId?: string, productId?: string, limit: number = 10) {
    switch (type) {
      case RecommendationType.TRENDING:
        return this.repository.getTrendingProducts(limit);
      case RecommendationType.SIMILAR_PRODUCTS:
        if (!productId) return [];
        return this.repository.getSimilarProducts(productId, limit);
      case RecommendationType.BASED_ON_HISTORY:
        if (!userId) return [];
        // First try cache
        const cached = await this.repository.getCachedRecommendations(userId, type, limit);
        if (cached.length > 0) return cached;
        // Fallback or trigger refresh (for MVP, we'll return empty if not cached yet)
        return [];
      default:
        // Other types like AUCTIONS_ENDING_SOON or FREQUENTLY_BOUGHT_TOGETHER
        // can be implemented here or fall back to empty
        return [];
    }
  }

  async trackView(userId: string, productId: string) {
    await this.repository.trackInteraction({
      userId,
      listingId: productId,
      interaction: InteractionType.VIEW,
    });
  }

  async trackInteraction(userId: string, productId: string, interaction: InteractionType) {
    await this.repository.trackInteraction({
      userId,
      listingId: productId,
      interaction,
    });
  }

  async refreshAll() {
    console.log('Refreshing all recommendations...');
    await this.processor.computeTrending();
    await this.processor.computeSimilarities();
  }
}
