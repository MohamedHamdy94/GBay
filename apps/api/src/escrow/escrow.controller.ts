import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowStatus } from '@gbay/database';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { AdminActionKeyGuard } from '../seller/admin-action-key.guard';

@Controller('admin/escrow')
@UseGuards(BearerAuthGuard, AdminActionKeyGuard)
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Get()
  async getAllEscrows(
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: EscrowStatus
  ) {
    return this.escrowService.getAllEscrows({ buyerId, sellerId, status });
  }

  @Get(':id')
  async getEscrow(@Param('id') id: string) {
    return this.escrowService.getHold(id);
  }

  @Post(':id/release')
  async release(@Param('id') id: string, @Body() metadata?: any) {
    return this.escrowService.releaseToSeller(id, metadata);
  }

  @Post(':id/refund')
  async refund(@Param('id') id: string, @Body() metadata?: any) {
    return this.escrowService.refundToBuyer(id, metadata);
  }

  @Post(':id/dispute')
  async dispute(@Param('id') id: string, @Body() metadata?: any) {
    return this.escrowService.disputeEscrow(id, metadata);
  }
}
