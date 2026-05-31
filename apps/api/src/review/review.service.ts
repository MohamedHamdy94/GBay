import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REVIEW_REPOSITORY, IReviewRepository } from './review.types';
import { CreateReviewDto, ReviewResponseDto } from './dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly repository: IReviewRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(EventEmitter2)
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReview(userId: string, orderId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    // 1. Fetch order and verify eligibility
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: true,
        review: true 
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Only the buyer can review this order');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Reviews can only be left for delivered orders');
    }

    if (order.review) {
      throw new BadRequestException('A review has already been submitted for this order');
    }

    // For MVP, we take the first item in the order to associate the review with a listing
    const firstItem = order.items.find(item => item.listingId !== null);
    if (!firstItem || !firstItem.listingId) {
      throw new BadRequestException('Order has no valid listing items to review');
    }

    // 2. Create review
    const review = await this.repository.create({
      orderId: order.id,
      reviewerId: userId,
      sellerId: order.sellerId,
      listingId: firstItem.listingId,
      rating: dto.rating,
      comment: dto.comment,
    });

    // 3. Emit event for integration (e.g., updating dashboard metrics)
    this.eventEmitter.emit('review.created', {
      reviewId: review.id,
      sellerId: order.sellerId,
      rating: dto.rating,
    });

    return review;
  }

  async getListingReviews(listingId: string, limit: number = 10, page: number = 1): Promise<ReviewResponseDto[]> {
    const skip = (page - 1) * limit;
    return this.repository.findByListing(listingId, limit, skip);
  }

  async getSellerReviews(sellerId: string, limit: number = 10, page: number = 1): Promise<ReviewResponseDto[]> {
    const skip = (page - 1) * limit;
    return this.repository.findBySeller(sellerId, limit, skip);
  }

  async getMyReviews(userId: string, limit: number = 10, page: number = 1): Promise<ReviewResponseDto[]> {
    const skip = (page - 1) * limit;
    return this.repository.findByUser(userId, limit, skip);
  }

  async getSellerRatingStats(sellerId: string) {
    return this.repository.getSellerRatingStats(sellerId);
  }
}
