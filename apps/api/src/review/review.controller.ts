import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { TokenService } from '../auth/token.service';

@Controller()
export class ReviewController {
  constructor(
    @Inject(forwardRef(() => ReviewService))
    private readonly service: ReviewService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('orders/:id/review')
  @UseGuards(BearerAuthGuard)
  async createReview(
    @Param('id') orderId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.service.createReview(userId, orderId, dto);
  }

  @Get('listings/:id/reviews')
  async getListingReviews(
    @Param('id') listingId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.service.getListingReviews(
      listingId,
      limit ? parseInt(limit, 10) : 10,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('seller/reviews')
  @UseGuards(BearerAuthGuard)
  async getSellerReviews(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getSellerReviews(
        userId, 
        limit ? parseInt(limit, 10) : 10,
        page ? parseInt(page, 10) : 1,
    );
  }

  @Get('seller/:id/reviews')
  async getPublicSellerReviews(
    @Param('id') sellerId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.service.getSellerReviews(
      sellerId,
      limit ? parseInt(limit, 10) : 10,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('reviews/me')
  @UseGuards(BearerAuthGuard)
  async getMyReviews(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const userId = (req as any).user.id;
    return this.service.getMyReviews(
      userId,
      limit ? parseInt(limit, 10) : 10,
      page ? parseInt(page, 10) : 1,
    );
  }
}
