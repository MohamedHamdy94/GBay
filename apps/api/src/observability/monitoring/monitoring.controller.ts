import { Controller, Get, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { MonitoringGuard } from './monitoring.guard';
import { MonitoringService } from './monitoring.service';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '../health/health-indicators/prisma.health';
import { MeilisearchHealthIndicator } from '../health/health-indicators/meilisearch.health';
import { RedisHealthIndicator } from '../health/health-indicators/redis.health';

@Controller('admin/monitoring')
@UseGuards(MonitoringGuard)
export class MonitoringController {
  constructor(
    @Inject(forwardRef(() => MonitoringService))
    private readonly monitoringService: MonitoringService,
    @Inject(HealthCheckService) private readonly healthCheckService: HealthCheckService,
    @Inject(PrismaHealthIndicator) private readonly prismaHealth: PrismaHealthIndicator,
    @Inject(MeilisearchHealthIndicator) private readonly meilisearchHealth: MeilisearchHealthIndicator,
    @Inject(RedisHealthIndicator) private readonly redisHealth: RedisHealthIndicator,
  ) {
    console.log('MonitoringController initialized. healthCheckService:', !!this.healthCheckService, 'monitoringService:', !!this.monitoringService, 'prismaHealth:', !!this.prismaHealth);
  }

  @Get('health')
  @HealthCheck()
  getDetailedHealth() {
    return this.healthCheckService.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.meilisearchHealth.isHealthy('meilisearch'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('errors')
  getRecentErrors() {
    try {
      const errors = this.monitoringService.getRecentErrors();
      // Ensure it's serializable
      return JSON.parse(JSON.stringify(errors));
    } catch (e: any) {
      console.error('Failed to get recent errors:', e);
      throw e;
    }
  }

  @Get('metrics/summary')
  getMetricsSummary() {
    // This could return a summary of prometheus metrics or other gathered data
    // For now, return a placeholder or some internal stats
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
