import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './health-indicators/prisma.health';
import { MeilisearchHealthIndicator } from './health-indicators/meilisearch.health';
import { RedisHealthIndicator } from './health-indicators/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly healthCheckService: HealthCheckService,
    @Inject(PrismaHealthIndicator) private readonly prismaHealth: PrismaHealthIndicator,
    @Inject(MeilisearchHealthIndicator) private readonly meilisearchHealth: MeilisearchHealthIndicator,
    @Inject(RedisHealthIndicator) private readonly redisHealth: RedisHealthIndicator,
  ) {
    console.log('HealthController initialized. healthCheckService:', !!this.healthCheckService, 'prismaHealth:', !!this.prismaHealth);
  }

  @Get()
  @HealthCheck()
  async check() {
    try {
      return await this.healthCheckService.check([
        () => this.prismaHealth.isHealthy('database'),
        () => this.meilisearchHealth.isHealthy('meilisearch'),
        () => this.redisHealth.isHealthy('redis'),
      ]);
    } catch (e: any) {
      console.error('Health check failed:', e);
      throw e;
    }
  }
}
