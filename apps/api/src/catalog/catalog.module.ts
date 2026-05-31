import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService, CATALOG_REPOSITORY } from './catalog.service';
import { PrismaCatalogRepository } from './prisma-catalog.repository';
import { InMemoryCatalogRepository } from './in-memory-catalog.repository';
import { SellerModule } from '../seller/seller.module';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [SellerModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    TokenService,
    PrismaCatalogRepository,
    {
      provide: CATALOG_REPOSITORY,
      useFactory: (prismaRepository: PrismaCatalogRepository) => {
        if (process.env.CATALOG_REPOSITORY === 'memory') return new InMemoryCatalogRepository();
        return prismaRepository;
      },
      inject: [PrismaCatalogRepository],
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
