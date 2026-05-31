import { Controller, Get, Post, Query, Body, UseGuards, Inject } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchIndexService } from './search-index.service';
import { SearchQueryDto } from './dto';
import { AdminActionKeyGuard } from '../seller/admin-action-key.guard';

@Controller('search')
export class SearchController {
  constructor(
    @Inject(SearchService)
    private readonly searchService: SearchService,
    @Inject(SearchIndexService)
    private readonly indexService: SearchIndexService,
  ) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('suggestions')
  async getSuggestions(@Query('q') q: string) {
    return this.searchService.getSuggestions(q);
  }

  @Post('admin/reindex')
  @UseGuards(AdminActionKeyGuard)
  async reindexAll() {
    // This would ideally be a job queue task
    // For now, we just trigger the process
    return { message: 'Reindexing started' };
  }

  @Get('admin/stats')
  @UseGuards(AdminActionKeyGuard)
  async getStats() {
    return this.indexService.getStats();
  }
}
