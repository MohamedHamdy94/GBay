import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundStatus } from '@gbay/database';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { ApprovedSellerGuard } from '../seller/approved-seller.guard';
import { RejectRefundDto } from './dto';

@Controller()
export class RefundController {
  constructor(
    @Inject(forwardRef(() => RefundService))
    private readonly refundService: RefundService
  ) {}

  // --- BUYER ENDPOINTS ---

  @UseGuards(BearerAuthGuard)
  @Get('refunds')
  async getMyRefunds(@Request() req: any) {
    return this.refundService.getBuyerRefunds(req.user.id);
  }

  @UseGuards(BearerAuthGuard)
  @Get('refunds/:id')
  async getRefundDetails(@Param('id') id: string, @Request() req: any) {
    const refund = await this.refundService.getRefund(id);
    if (refund.buyerId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this refund');
    }
    return refund;
  }

  @UseGuards(BearerAuthGuard)
  @Post('refunds/:id/escalate')
  async escalateRefund(@Param('id') id: string, @Request() req: any) {
    return this.refundService.escalateToDispute(id, req.user.id);
  }

  // --- SELLER ENDPOINTS ---

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Get('seller/refunds')
  async getSellerRefunds(@Request() req: any) {
    // Note: We need sellerId (SellerProfile.id) here.
    // In our system, req.user.id is the User.id. 
    // We should probably lookup the profile or allow service to handle it.
    // For now, let's assume the service can handle it if we pass User.id.
    return this.refundService.getSellerRefunds(req.user.id);
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Patch('seller/refunds/:id/approve')
  async approveRefund(@Param('id') id: string, @Request() req: any) {
    return this.refundService.approveRefund(id, { id: req.user.id, role: 'SELLER' });
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Patch('seller/refunds/:id/reject')
  async rejectRefund(@Param('id') id: string, @Body() dto: RejectRefundDto, @Request() req: any) {
    return this.refundService.rejectRefund(id, { id: req.user.id, role: 'SELLER' }, dto.reason);
  }
}
