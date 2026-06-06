import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationType } from '@gbay/database';
import { SellerService } from '../seller/seller.service';

import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationListeners {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(SellerService)
    private readonly sellerService: SellerService,
    @Inject(NotificationGateway)
    private readonly gateway: NotificationGateway,
  ) {}

  private async createAndNotify(input: any) {
    const notification = await this.notificationService.create(input);
    this.gateway.sendToUser(input.userId, notification);
    return notification;
  }

  @OnEvent('order.confirmed')
  async handleOrderConfirmed(payload: { orderId: string; sellerId: string }) {
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'New Order Confirmed',
      body: `You have a new confirmed order ${payload.orderId}!`,
      data: { orderId: payload.orderId },
    });
  }

  @OnEvent('order.shipped')
  async handleOrderShipped(payload: { orderId: string; userId: string }) {
    await this.createAndNotify({
      userId: payload.userId,
      type: NotificationType.ORDER_SHIPPED,
      title: 'Order Shipped',
      body: `Your order ${payload.orderId} has been shipped!`,
      data: { orderId: payload.orderId },
    });
  }

  @OnEvent('order.delivered')
  async handleOrderDelivered(payload: { orderId: string; userId: string }) {
    await this.createAndNotify({
      userId: payload.userId,
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order Delivered',
      body: `Your order ${payload.orderId} has been delivered!`,
      data: { orderId: payload.orderId },
    });
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: { orderId: string; userId: string; sellerId: string }) {
    // Notify buyer
    await this.createAndNotify({
      userId: payload.userId,
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled',
      body: `Your order ${payload.orderId} has been cancelled.`,
      data: { orderId: payload.orderId },
    });
    // Notify seller
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled',
      body: `Order ${payload.orderId} has been cancelled.`,
      data: { orderId: payload.orderId },
    });
  }

  @OnEvent('order.return_requested')
  async handleReturnRequested(payload: { orderId: string; sellerId: string }) {
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.RETURN_REQUESTED,
      title: 'Return Requested',
      body: `A return has been requested for order ${payload.orderId}.`,
      data: { orderId: payload.orderId },
    });
  }

  @OnEvent('refund.completed')
  async handleRefundCompleted(payload: { refundId: string; buyerId: string }) {
    await this.createAndNotify({
      userId: payload.buyerId,
      type: NotificationType.REFUND_COMPLETED,
      title: 'Refund Completed',
      body: `Your refund for refund ID ${payload.refundId} has been completed.`,
      data: { refundId: payload.refundId },
    });
  }

  @OnEvent('dispute.opened')
  async handleDisputeOpened(payload: { disputeId: string; buyerId: string; sellerId: string }) {
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.DISPUTE_OPENED,
      title: 'Dispute Opened',
      body: `A dispute has been opened for order ${payload.disputeId}.`,
      data: { disputeId: payload.disputeId },
    });
  }

  @OnEvent('dispute.resolved')
  async handleDisputeResolved(payload: { disputeId: string; buyerId: string; sellerId: string; outcome: string }) {
    // Notify buyer
    await this.createAndNotify({
      userId: payload.buyerId,
      type: NotificationType.DISPUTE_RESOLVED,
      title: 'Dispute Resolved',
      body: `Your dispute ${payload.disputeId} has been resolved. Outcome: ${payload.outcome}`,
      data: { disputeId: payload.disputeId },
    });
    // Notify seller
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.DISPUTE_RESOLVED,
      title: 'Dispute Resolved',
      body: `Dispute ${payload.disputeId} has been resolved. Outcome: ${payload.outcome}`,
      data: { disputeId: payload.disputeId },
    });
  }

  @OnEvent('message.received')
  async handleMessageReceived(payload: { threadId: string; senderId: string; recipientId: string; body: string }) {
    await this.createAndNotify({
      userId: payload.recipientId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New Message',
      body: payload.body.substring(0, 50) + (payload.body.length > 50 ? '...' : ''),
      data: { threadId: payload.threadId },
    });
  }

  @OnEvent('auction.won')
  async handleAuctionWon(payload: { auctionId: string; winnerId: string; sellerId: string; amountCents: number }) {
    // Notify winner
    await this.createAndNotify({
      userId: payload.winnerId,
      type: NotificationType.AUCTION_WON,
      title: 'Auction Won!',
      body: `Congratulations! You won the auction ${payload.auctionId}!`,
      data: { auctionId: payload.auctionId },
    });
    // Notify seller
    const seller = await this.sellerService.getSeller(payload.sellerId);
    await this.createAndNotify({
      userId: seller.userId,
      type: NotificationType.AUCTION_WON,
      title: 'Auction Item Sold',
      body: `Your auction ${payload.auctionId} has ended with a winner.`,
      data: { auctionId: payload.auctionId },
    });
  }

  @OnEvent('auction.outbid')
  async handleAuctionOutbid(payload: { auctionId: string; userId: string; newPriceCents: number }) {
    await this.createAndNotify({
      userId: payload.userId,
      type: NotificationType.AUCTION_OUTBID,
      title: 'Outbid!',
      body: `You have been outbid on auction ${payload.auctionId}. New price: ${payload.newPriceCents / 100}`,
      data: { auctionId: payload.auctionId },
    });
  }
}
