import { Module } from '@nestjs/common';
import { TokenService } from '../auth/token.service';
import { AdminActionKeyGuard } from './admin-action-key.guard';
import { ApprovedSellerGuard } from './approved-seller.guard';
import { BearerAuthGuard } from './bearer-auth.guard';
import { InMemorySellerRepository } from './in-memory-seller.repository';
import { PrismaSellerRepository } from './prisma-seller.repository';
import { SellerController } from './seller.controller';
import { SELLER_REPOSITORY, SellerService } from './seller.service';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerController],
  providers: [
    SellerService,
    TokenService,
    BearerAuthGuard,
    ApprovedSellerGuard,
    AdminActionKeyGuard,
    PrismaSellerRepository,
    {
      provide: SELLER_REPOSITORY,
      useFactory: (prismaRepository: PrismaSellerRepository) => {
        if (process.env.SELLER_REPOSITORY === 'memory') return new InMemorySellerRepository();
        return prismaRepository;
      },
      inject: [PrismaSellerRepository],
    },
  ],
  exports: [SellerService, BearerAuthGuard, ApprovedSellerGuard],
})
export class SellerModule {}
