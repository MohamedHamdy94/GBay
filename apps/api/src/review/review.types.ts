import { ReviewResponseDto } from './dto';

export const REVIEW_REPOSITORY = 'REVIEW_REPOSITORY';

export interface IReviewRepository {
  create(data: {
    orderId: string;
    reviewerId: string;
    sellerId: string;
    listingId: string;
    rating: number;
    comment?: string;
  }): Promise<ReviewResponseDto>;
  
  findByListing(listingId: string, limit: number, skip: number): Promise<ReviewResponseDto[]>;
  findBySeller(sellerId: string, limit: number, skip: number): Promise<ReviewResponseDto[]>;
  findByUser(userId: string, limit: number, skip: number): Promise<ReviewResponseDto[]>;
  
  getSellerRatingStats(sellerId: string): Promise<{ averageRating: number; reviewCount: number }>;
}
