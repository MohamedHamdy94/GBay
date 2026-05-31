import { Controller, Get, Post, Query, UseGuards, Req, Body, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto, RefreshRecommendationsDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { AdminActionKeyGuard } from '../seller/admin-action-key.guard';
import { TokenService } from '../auth/token.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    @Inject(forwardRef(() => RecommendationService))
    private readonly service: RecommendationService,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  @Get()
  async getRecommendations(@Query() query: GetRecommendationsDto, @Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.service.getRecommendations(query.type, userId, query.productId, query.limit);
  }

  @Post('admin/refresh')
  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  async refresh(@Body() body: RefreshRecommendationsDto) {
    await this.service.refreshAll();
    return { message: 'Refresh triggered' };
  }

  private getUserIdFromRequest(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.tokenService.verifyAccessToken(token);
        return payload.sub;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }
}
