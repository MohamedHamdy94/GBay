import { Injectable, Inject, NotFoundException, ConflictException, forwardRef, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RefundStatus, Currency, OrderStatus, EscrowStatus } from '@gbay/database';
import { RefundRepository, REFUND_REPOSITORY, RefundView, CreateRefundInput } from './refund.types';
import { assertRefundTransition, assertRefundRolePermission } from './refund.state-machine';
import { OrderService } from '../order/order.service';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class RefundService {
  constructor(
    @Inject(REFUND_REPOSITORY) private readonly refundRepo: RefundRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => OrderService)) private readonly orderService: OrderService,
    @Inject(forwardRef(() => EscrowService)) private readonly escrowService: EscrowService,
  ) {}

  async requestRefund(input: CreateRefundInput, tx?: any): Promise<RefundView> {
    const existing = await this.refundRepo.findByOrderId(input.orderId, tx);
    if (existing) {
      if (existing.idempotencyKey === input.idempotencyKey) return existing;
      throw new ConflictException('Refund already exists for this order');
    }

    return this.refundRepo.create(input, tx);
  }

  async approveRefund(refundId: string, actor: { id: string; role: any }, tx?: any): Promise<RefundView> {
    const refund = await this.getRefundOrThrow(refundId, tx);
    
    assertRefundTransition(refund.status, RefundStatus.APPROVED);
    assertRefundRolePermission(actor.role, RefundStatus.APPROVED, refund.status);

    // If seller is approving, ensure they own the refund
    if (actor.role === 'SELLER' && refund.sellerId !== actor.id) {
       // Check if actor.id is the userId of the seller profile
       // In our system, sellerId in Refund is the SellerProfile.id
       // We need to verify if the actor.id (User.id) matches SellerProfile.userId
       const order = await this.orderService.getOrderDetails(refund.orderId);
       if (order.seller.userId !== actor.id) {
         throw new ConflictException('Unauthorized to approve this refund');
       }
    }

    const updated = await this.refundRepo.updateStatus(refundId, RefundStatus.APPROVED, {
      actor: actor.id,
      role: actor.role,
    }, tx);

    // Trigger processing automatically
    return this.processRefund(refundId, tx);
  }

  async rejectRefund(refundId: string, actor: { id: string; role: any }, reason: string, tx?: any): Promise<RefundView> {
    const refund = await this.getRefundOrThrow(refundId, tx);

    assertRefundTransition(refund.status, RefundStatus.REJECTED);
    assertRefundRolePermission(actor.role, RefundStatus.REJECTED, refund.status);

    if (actor.role === 'SELLER') {
      const order = await this.orderService.getOrderDetails(refund.orderId);
      if (order.seller.userId !== actor.id) {
        throw new ConflictException('Unauthorized to reject this refund');
      }
    }

    return this.refundRepo.updateStatus(refundId, RefundStatus.REJECTED, {
      actor: actor.id,
      role: actor.role,
      payload: { reason },
    }, tx);
  }

  async processRefund(refundId: string, tx?: any): Promise<RefundView> {
    const refund = await this.getRefundOrThrow(refundId, tx);
    
    // Only APPROVED or FAILED can move to PROCESSING
    assertRefundTransition(refund.status, RefundStatus.PROCESSING);

    const updated = await this.refundRepo.updateStatus(refundId, RefundStatus.PROCESSING, undefined, tx);

    try {
      // Coordinate with Escrow
      const escrow = await this.escrowService.getHoldByOrderId(refund.orderId, tx);
      if (escrow) {
        if (escrow.status === EscrowStatus.HELD || escrow.status === EscrowStatus.DISPUTED) {
          await this.escrowService.refundToBuyer(escrow.id, { refundId: refund.id }, tx);
        } else if (escrow.status === EscrowStatus.REFUNDED_TO_BUYER) {
          // Already done
        } else {
          throw new ConflictException(`Cannot refund escrow in status ${escrow.status}`);
        }
      }

      // Mark as COMPLETED
      return this.completeRefund(refundId, tx);
    } catch (error) {
      console.error(`Refund processing failed for ${refundId}:`, error);
      await this.refundRepo.updateStatus(refundId, RefundStatus.FAILED, {
        payload: { error: error instanceof Error ? error.message : String(error) },
      }, tx);
      throw error;
    }
  }

  async completeRefund(refundId: string, tx?: any): Promise<RefundView> {
    const refund = await this.getRefundOrThrow(refundId, tx);
    assertRefundTransition(refund.status, RefundStatus.COMPLETED);

    const updated = await this.refundRepo.updateStatus(refundId, RefundStatus.COMPLETED, undefined, tx);

    // Sync with Order
    await this.orderService.updateStatus(refund.orderId, OrderStatus.REFUNDED as any, { id: 'SYSTEM', role: 'SYSTEM' });

    this.eventEmitter.emit('refund.completed', { refundId: updated.id, buyerId: updated.buyerId });

    return updated;
  }

  async escalateToDispute(refundId: string, buyerId: string, tx?: any): Promise<RefundView> {
    const refund = await this.getRefundOrThrow(refundId, tx);
    
    if (refund.buyerId !== buyerId) throw new ConflictException('Unauthorized');
    assertRefundTransition(refund.status, RefundStatus.ESCALATED);

    return this.refundRepo.updateStatus(refundId, RefundStatus.ESCALATED, {
      actor: buyerId,
      role: 'BUYER',
    }, tx);
  }

  async getRefund(id: string, tx?: any): Promise<RefundView> {
    const refund = await this.refundRepo.findById(id, tx);
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  async getRefundByOrderId(orderId: string, tx?: any): Promise<RefundView | null> {
    return this.refundRepo.findByOrderId(orderId, tx);
  }

  async getBuyerRefunds(userId: string): Promise<RefundView[]> {
    return this.refundRepo.findByBuyerId(userId);
  }

  async getSellerRefunds(sellerId: string): Promise<RefundView[]> {
    return this.refundRepo.findBySellerId(sellerId);
  }

  async getAllRefunds(filters?: { status?: RefundStatus; buyerId?: string; sellerId?: string }): Promise<RefundView[]> {
    return this.refundRepo.findAll(filters);
  }

  private async getRefundOrThrow(id: string, tx?: any): Promise<RefundView> {
    const refund = await this.refundRepo.findById(id, tx);
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }
}
