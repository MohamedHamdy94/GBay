import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
      });
      
      const status = await redis.ping().catch(() => 'FAILED');
      await redis.quit().catch(() => {});
      
      if (status === 'PONG') {
        return this.getStatus(key, true);
      }
      
      return this.getStatus(key, true, { message: 'Redis is not reachable (optional fallback to memory)', status });
    } catch (error: any) {
      return this.getStatus(key, true, { message: 'Redis health check failed (optional)', error: error.message });
    }
  }
}
