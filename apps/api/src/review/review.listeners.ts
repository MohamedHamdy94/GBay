import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReviewService } from './review.service';
import { SellerService } from '../seller/seller.service';

@Injectable()
export class ReviewListeners {
  constructor(
    @Inject(forwardRef(() => ReviewService))
    private readonly reviewService: ReviewService,
    @Inject(forwardRef(() => SellerService))
    private readonly sellerService: SellerService,
  ) {}

  @OnEvent('review.created')
  async handleReviewCreated(payload: { reviewId: string; sellerId: string; rating: number }) {
    console.log(`Handling review.created for seller ${payload.sellerId}`);
    
    // Fetch updated stats for the seller
    const stats = await this.reviewService.getSellerRatingStats(payload.sellerId);
    
    // Update seller dashboard metrics
    // Note: We need to make sure SellerService has a method to update these metrics
    // or we do it via the repository. 
    // In this project, SellerService.getDashboard auto-initializes metrics.
    // Let's see if we need to add an explicit update method to SellerService.
    await this.sellerService.updateDashboardMetrics(payload.sellerId, {
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
    });
  }
}
