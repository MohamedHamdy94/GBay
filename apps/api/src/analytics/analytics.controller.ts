import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from '../admin/admin.guard';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { 
  RevenueChartQueryDto, 
  TopProductsQueryDto, 
  TopSellersQueryDto, 
  EventLogQueryDto 
} from './dto';

@Controller('admin/analytics')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService)
    private readonly analyticsService: AnalyticsService
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('revenue')
  async getRevenueChart(@Query() query: RevenueChartQueryDto) {
    return this.analyticsService.getRevenueChart(query.period);
  }

  @Get('top-products')
  async getTopProducts(@Query() query: TopProductsQueryDto) {
    return this.analyticsService.getTopProducts(Number(query.limit));
  }

  @Get('top-sellers')
  async getTopSellers(@Query() query: TopSellersQueryDto) {
    return this.analyticsService.getTopSellers(Number(query.limit));
  }

  @Get('events')
  async getEvents(@Query() query: EventLogQueryDto) {
    return this.analyticsService.getEvents({
      type: query.type,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: Number(query.limit),
      offset: Number(query.offset),
    });
  }
}
