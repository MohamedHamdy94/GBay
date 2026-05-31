import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchIndexService } from './search-index.service';
import { SearchListeners } from './search.listeners';
import { SearchController } from './search.controller';
import { DatabaseModule } from '../database.module';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchIndexService,
    SearchListeners,
    TokenService,
  ],
  exports: [SearchService, SearchIndexService],
})
export class SearchModule {}
