import { Injectable, Inject, Logger } from '@nestjs/common';
import { 
  ANALYTICS_REPOSITORY, 
  IAnalyticsRepository, 
  DashboardStats, 
  ChartDataPoint, 
  TopProduct, 
  TopSeller, 
  EventFilter,
  AnalyticsEvent,
  CreateAnalyticsEventDto
} from './analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject(ANALYTICS_REPOSITORY)
    private repository: IAnalyticsRepository,
  ) {}

  async trackEvent(data: CreateAnalyticsEventDto): Promise<void> {
    try {
      await this.repository.createEvent(data);
    } catch (error: any) {
      this.logger.error(`Failed to track event ${data.eventType}: ${error.message}`);
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.repository.getDashboardStats();
  }

  async getRevenueChart(period: 'daily' | 'weekly' | 'monthly'): Promise<ChartDataPoint[]> {
    return this.repository.getRevenueChart(period);
  }

  async getTopProducts(limit: number): Promise<TopProduct[]> {
    return this.repository.getTopProducts(limit);
  }

  async getTopSellers(limit: number): Promise<TopSeller[]> {
    return this.repository.getTopSellers(limit);
  }

  async getEvents(filter: EventFilter): Promise<{ events: AnalyticsEvent[]; total: number }> {
    return this.repository.getEvents(filter);
  }

  async processDailyMetrics(date: Date = new Date()): Promise<void> {
    this.logger.log(`Processing daily metrics for ${date.toISOString().split('T')[0]}`);
    try {
      const metrics = await this.repository.aggregateMetricsForDate(date);
      await this.repository.upsertDailyMetrics(metrics);
      this.logger.log(`Successfully processed daily metrics for ${date.toISOString().split('T')[0]}`);
    } catch (error: any) {
      this.logger.error(`Failed to process daily metrics: ${error.message}`);
      throw error;
    }
  }
}
