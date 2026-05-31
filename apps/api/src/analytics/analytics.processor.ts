import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';
import { Logger } from '@nestjs/common';

@Processor('analytics-daily-metrics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing analytics job: ${job.name}`);

    if (job.name === 'calculate-daily-metrics') {
      const date = job.data?.date ? new Date(job.data.date) : new Date();
      // We process metrics for yesterday if it's a scheduled job
      if (!job.data?.date) {
        date.setDate(date.getDate() - 1);
      }
      await this.analyticsService.processDailyMetrics(date);
    }

    return { status: 'completed' };
  }
}
