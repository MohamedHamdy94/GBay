import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FraudRuleEngine } from './fraud.rule-engine';

@Injectable()
export class FraudListeners {
  private readonly logger = new Logger(FraudListeners.name);

  constructor(private ruleEngine: FraudRuleEngine) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: { userId: string; ipAddress?: string; userAgent?: string }) {
    this.logger.log(`Handling user.registered event for user ${payload.userId}`);
    await this.ruleEngine.evaluateEvent('user.registered', payload);
  }

  @OnEvent('auction.bid.placed')
  async handleBidPlaced(payload: { 
    bidId: string; 
    auctionId: string; 
    bidderId: string; 
    amountCents: number;
    ipAddress?: string;
  }) {
    this.logger.log(`Handling auction.bid.placed event for auction ${payload.auctionId} by bidder ${payload.bidderId}`);
    await this.ruleEngine.evaluateEvent('auction.bid.placed', payload);
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(payload: { orderId: string; userId: string; ipAddress?: string }) {
    this.logger.log(`Handling order.confirmed event for order ${payload.orderId}`);
    await this.ruleEngine.evaluateEvent('order.confirmed', payload);
  }

  @OnEvent('refund.requested')
  async handleRefundRequested(payload: { refundId: string; buyerId: string }) {
    this.logger.log(`Handling refund.requested event for refund ${payload.refundId}`);
    await this.ruleEngine.evaluateEvent('refund.requested', payload);
  }
}
