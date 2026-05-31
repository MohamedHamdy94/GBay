import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionBiddingService } from './auction-bidding.service';
import { CreateAuctionDto, PlaceBidDto, AuctionFilterDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { ApprovedSellerGuard } from '../seller/approved-seller.guard';

type AuthenticatedRequest = { user: { id: string; email: string | null } };

@Controller('auctions')
export class AuctionController {
  constructor(
    @Inject(AuctionService) private readonly auctionService: AuctionService,
    @Inject(AuctionBiddingService) private readonly biddingService: AuctionBiddingService,
  ) {}

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAuctionDto) {
    return this.auctionService.create({
      ...dto,
      sellerId: req.user.id,
      currency: dto.currency as any,
    });
  }

  @Get()
  list(@Query() filter: AuctionFilterDto) {
    return this.auctionService.listActive(filter);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.auctionService.findById(id);
  }

  @UseGuards(BearerAuthGuard)
  @Post(':id/bid')
  placeBid(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: PlaceBidDto) {
    return this.biddingService.placeBid(id, req.user.id, dto.amountCents, dto.isProxy, dto.idempotencyKey);
  }

  @UseGuards(BearerAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // Basic cancel (seller only, no bids)
    return this.auctionService.cancel(id, req.user.id);
  }
}
