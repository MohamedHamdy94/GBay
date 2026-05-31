import { Injectable, Inject } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { SearchIndexService } from '../../../search/search-index.service';

@Injectable()
export class MeilisearchHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(SearchIndexService)
    private readonly searchIndexService: SearchIndexService
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.searchIndexService.isEnabled) {
      return this.getStatus(key, true, { message: 'Meilisearch is disabled (optional)' });
    }

    try {
      // Meilisearch client doesn't have a direct health() in the version used sometimes, 
      // but we can check if it responds to stats or version
      const stats = await this.searchIndexService.getStats();
      return this.getStatus(key, true, { stats });
    } catch (error: any) {
      throw new HealthCheckError(
        'Meilisearch health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
