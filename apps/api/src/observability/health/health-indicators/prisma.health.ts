import { Injectable, Inject } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error: any) {
      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
