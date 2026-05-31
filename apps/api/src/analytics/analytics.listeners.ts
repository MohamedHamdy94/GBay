import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsListeners {
  private readonly logger = new Logger(AnalyticsListeners.name);

  constructor(private analyticsService: AnalyticsService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: { userId: string }) {
    await this.analyticsService.trackEvent({
      eventType: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: payload.userId,
      userId: payload.userId,
    });
  }

  @OnEvent('seller.approved')
  async handleSellerApproved(payload: { sellerId: string; userId: string }) {
    await this.analyticsService.trackEvent({
      eventType: 'SELLER_APPROVED',
      entityType: 'SELLER',
      entityId: payload.sellerId,
      userId: payload.userId,
      sellerId: payload.sellerId,
    });
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(payload: { orderId: string; userId: string; sellerId: string; amountCents: number }) {
    await this.analyticsService.trackEvent({
      eventType: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: payload.orderId,
      userId: payload.userId,
      sellerId: payload.sellerId,
      data: { amountCents: payload.amountCents },
    });
  }

  @OnEvent('auction.bid.placed')
  async handleBidPlaced(payload: { auctionId: string; bidderId: string; amountCents: number }) {
    await this.analyticsService.trackEvent({
      eventType: 'AUCTION_BID',
      entityType: 'AUCTION',
      entityId: payload.auctionId,
      userId: payload.bidderId,
      data: { amountCents: payload.amountCents },
    });
  }

  @OnEvent('refund.completed')
  async handleRefundCompleted(payload: { refundId: string; orderId: string; amountCents: number }) {
    await this.analyticsService.trackEvent({
      eventType: 'REFUND_COMPLETED',
      entityType: 'REFUND',
      entityId: payload.refundId,
      data: { orderId: payload.orderId, amountCents: payload.amountCents },
    });
  }

  @OnEvent('dispute.opened')
  async handleDisputeOpened(payload: { disputeId: string; refundId: string }) {
    await this.analyticsService.trackEvent({
      eventType: 'DISPUTE_OPENED',
      entityType: 'DISPUTE',
      entityId: payload.disputeId,
      data: { refundId: payload.refundId },
    });
  }
}
