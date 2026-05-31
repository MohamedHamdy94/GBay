import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsListeners } from './analytics.listeners';
import { AnalyticsProcessor } from './analytics.processor';
import { PrismaAnalyticsRepository } from './prisma-analytics.repository';
import { ANALYTICS_REPOSITORY } from './analytics.types';
import { DatabaseModule } from '../database.module';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    /*
    BullModule.registerQueue({
      name: 'analytics-daily-metrics',
    }),
    */
    DatabaseModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsListeners,
    AnalyticsProcessor,
    {
      provide: ANALYTICS_REPOSITORY,
      useClass: PrismaAnalyticsRepository,
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
