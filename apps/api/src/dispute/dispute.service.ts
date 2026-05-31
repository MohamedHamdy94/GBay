import { Injectable, Inject, NotFoundException, ConflictException, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DisputeStatus, DisputeReason, EscrowStatus, RefundStatus } from '@gbay/database';
import { DisputeRepository, DISPUTE_REPOSITORY, DisputeView, CreateDisputeInput, DisputeMessageView } from './dispute.types';
import { assertDisputeTransition, assertDisputeRolePermission } from './dispute.state-machine';
import { RefundService } from '../refund/refund.service';
import { EscrowService } from '../escrow/escrow.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class DisputeService {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: DisputeRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => RefundService)) private readonly refundService: RefundService,
    @Inject(forwardRef(() => EscrowService)) private readonly escrowService: EscrowService,
    @Inject(forwardRef(() => MessagingService)) private readonly messagingService: MessagingService,
  ) {}

  async openDispute(input: CreateDisputeInput, buyerId: string, tx?: any): Promise<DisputeView> {
    const refund = await this.refundService.getRefund(input.refundId, tx);
    if (refund.buyerId !== buyerId) throw new ConflictException('Unauthorized');

    // Ensure refund is in ESCALATED state
    if (refund.status !== RefundStatus.ESCALATED) {
      throw new ConflictException('Refund must be escalated before opening a dispute');
    }

    const existing = await this.disputeRepo.findByRefundId(input.refundId, tx);
    if (existing) return existing;

    const dispute = await this.disputeRepo.create(input, tx);

    // Update Escrow to DISPUTED
    const escrow = await this.escrowService.getHoldByOrderId(refund.orderId, tx);
    if (escrow && escrow.status === EscrowStatus.HELD) {
      await this.escrowService.disputeEscrow(escrow.id, { disputeId: dispute.id }, tx);
    }

    // Module 15: Create MessageThread for the dispute
    await this.messagingService.createThread({
      disputeId: dispute.id,
      subject: `Dispute for Order ${refund.orderId}`,
      body: `Dispute opened for reason: ${dispute.reason}. Description: ${dispute.description || 'N/A'}`,
    }, buyerId);

    this.eventEmitter.emit('dispute.opened', { disputeId: dispute.id, buyerId: refund.buyerId, sellerId: refund.sellerId });

    return dispute;
  }

  async addMessage(disputeId: string, senderId: string, message: string, tx?: any): Promise<DisputeMessageView> {
    const dispute = await this.getDisputeOrThrow(disputeId, tx);
    // TODO: Verify sender is buyer, seller, or admin linked to this dispute
    return this.disputeRepo.addMessage(disputeId, senderId, message, tx);
  }

  async reviewDispute(id: string, adminId: string, tx?: any): Promise<DisputeView> {
    const dispute = await this.getDisputeOrThrow(id, tx);
    assertDisputeTransition(dispute.status, DisputeStatus.UNDER_REVIEW);
    assertDisputeRolePermission('ADMIN', DisputeStatus.UNDER_REVIEW, dispute.status);

    return this.disputeRepo.updateStatus(id, DisputeStatus.UNDER_REVIEW, undefined, tx);
  }

  async resolveDispute(id: string, resolution: string, outcome: 'BUYER' | 'SELLER', adminId: string, tx?: any): Promise<DisputeView> {
    const dispute = await this.getDisputeOrThrow(id, tx);
    const toStatus = outcome === 'BUYER' ? DisputeStatus.RESOLVED_BUYER : DisputeStatus.RESOLVED_SELLER;
    
    assertDisputeTransition(dispute.status, toStatus);
    assertDisputeRolePermission('ADMIN', toStatus, dispute.status);

    const updated = await this.disputeRepo.updateStatus(id, toStatus, resolution, tx);

    const refund = await this.refundService.getRefund(dispute.refundId, tx);

    if (outcome === 'BUYER') {
      // Force approve refund
      await this.refundService.approveRefund(refund.id, { id: adminId, role: 'ADMIN' }, tx);
    } else {
      // Finalize rejection
      await this.refundService.rejectRefund(refund.id, { id: adminId, role: 'ADMIN' }, 'Dispute resolved in favor of seller', tx);
    }

    this.eventEmitter.emit('dispute.resolved', { disputeId: updated.id, buyerId: refund.buyerId, sellerId: refund.sellerId, outcome });

    return updated;
  }

  async closeDispute(id: string, adminId: string, tx?: any): Promise<DisputeView> {
    const dispute = await this.getDisputeOrThrow(id, tx);
    assertDisputeTransition(dispute.status, DisputeStatus.CLOSED);
    return this.disputeRepo.updateStatus(id, DisputeStatus.CLOSED, 'Closed by admin', tx);
  }

  async getDispute(id: string, tx?: any): Promise<DisputeView> {
    const dispute = await this.disputeRepo.findById(id, tx);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async getAllDisputes(filters?: { status?: DisputeStatus }): Promise<DisputeView[]> {
    return this.disputeRepo.findAll(filters);
  }

  private async getDisputeOrThrow(id: string, tx?: any): Promise<DisputeView> {
    const dispute = await this.disputeRepo.findById(id, tx);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }
}
