import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IReviewRepository } from './review.types';
import { ReviewResponseDto } from './dto';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: {
    orderId: string;
    reviewerId: string;
    sellerId: string;
    listingId: string;
    rating: number;
    comment?: string;
  }): Promise<ReviewResponseDto> {
    return this.prisma.review.create({
      data,
      include: {
        reviewer: {
          select: { name: true },
        },
      },
    });
  }

  async findByListing(listingId: string, limit: number, skip: number): Promise<ReviewResponseDto[]> {
    return this.prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        reviewer: {
          select: { name: true },
        },
      },
    });
  }

  async findBySeller(sellerId: string, limit: number, skip: number): Promise<ReviewResponseDto[]> {
    return this.prisma.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        reviewer: {
          select: { name: true },
        },
      },
    });
  }

  async findByUser(userId: string, limit: number, skip: number): Promise<ReviewResponseDto[]> {
    return this.prisma.review.findMany({
      where: { reviewerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        reviewer: {
          select: { name: true },
        },
      },
    });
  }

  async getSellerRatingStats(sellerId: string): Promise<{ averageRating: number; reviewCount: number }> {
    const stats = await this.prisma.review.aggregate({
      where: { sellerId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      averageRating: stats._avg.rating || 0,
      reviewCount: stats._count.id,
    };
  }
}
