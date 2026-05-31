import { Module } from '@nestjs/common';
import { AuctionController } from './auction.controller';
import { AUCTION_REPOSITORY, AuctionService } from './auction.service';
import { AuctionBiddingService } from './auction-bidding.service';
import { AuctionGateway } from './auction.gateway';
import { PrismaAuctionRepository } from './prisma-auction.repository';
import { TokenService } from '../auth/token.service';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [SellerModule],
  controllers: [AuctionController],
  providers: [
    AuctionService,
    AuctionBiddingService,
    AuctionGateway,
    TokenService,
    PrismaAuctionRepository,
    {
      provide: AUCTION_REPOSITORY,
      useClass: PrismaAuctionRepository,
    },
  ],
  exports: [AuctionService],
})
export class AuctionModule {}
