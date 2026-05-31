import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './health-indicators/prisma.health';
import { MeilisearchHealthIndicator } from './health-indicators/meilisearch.health';
import { RedisHealthIndicator } from './health-indicators/redis.health';
import { DatabaseModule } from '../../database.module';
import { SearchModule } from '../../search/search.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    DatabaseModule,
    SearchModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    MeilisearchHealthIndicator,
    RedisHealthIndicator,
  ],
  exports: [
    TerminusModule,
    PrismaHealthIndicator,
    MeilisearchHealthIndicator,
    RedisHealthIndicator,
  ],
})
export class HealthModule {}
