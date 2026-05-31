import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeStatus, DisputeReason } from '@gbay/database';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { AdminActionKeyGuard } from '../seller/admin-action-key.guard';
import { CreateDisputeDto } from '../refund/dto';

@Controller()
export class DisputeController {
  constructor(
    @Inject(forwardRef(() => DisputeService))
    private readonly disputeService: DisputeService
  ) {}

  // --- BUYER ENDPOINTS ---

  @UseGuards(BearerAuthGuard)
  @Post('disputes')
  async openDispute(@Body() dto: CreateDisputeDto, @Request() req: any) {
    return this.disputeService.openDispute({
      refundId: (dto as any).refundId, // Assuming refundId is passed
      reason: dto.reason as DisputeReason,
      description: dto.description,
      evidence: dto.evidence,
    }, req.user.id);
  }

  @UseGuards(BearerAuthGuard)
  @Post('disputes/:id/messages')
  async addMessage(@Param('id') id: string, @Body('message') message: string, @Request() req: any) {
    return this.disputeService.addMessage(id, req.user.id, message);
  }

  // --- ADMIN ENDPOINTS ---

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Get('admin/disputes')
  async getAllDisputes(@Query('status') status?: DisputeStatus) {
    return this.disputeService.getAllDisputes({ status });
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Get('admin/disputes/:id')
  async getDisputeDetails(@Param('id') id: string) {
    return this.disputeService.getDispute(id);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Patch('admin/disputes/:id/review')
  async reviewDispute(@Param('id') id: string, @Request() req: any) {
    return this.disputeService.reviewDispute(id, req.user.id);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Patch('admin/disputes/:id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Body('outcome') outcome: 'BUYER' | 'SELLER',
    @Request() req: any
  ) {
    return this.disputeService.resolveDispute(id, resolution, outcome, req.user.id);
  }
}
