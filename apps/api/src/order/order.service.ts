import { ConflictException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Currency } from '@gbay/database';
import { PrismaService } from '../prisma.service';
import { ORDER_REPOSITORY, OrderRepository, OrderView } from './order.types';
import { assertOrderRolePermission, assertOrderTransition, OrderStatus } from './order.state-machine';

import { EscrowService } from '../escrow/escrow.service';
import { ShippingService } from '../shipping/shipping.service';
import { RefundService } from '../refund/refund.service';
import { MetricsService } from '../observability/metrics/metrics.service';

@Injectable()
export class OrderService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => EscrowService)) private readonly escrowService: EscrowService,
    @Inject(forwardRef(() => ShippingService)) private readonly shippingService: ShippingService,
    @Inject(forwardRef(() => RefundService)) private readonly refundService: RefundService,
    @Inject(MetricsService) private readonly metricsService: MetricsService,
  ) {}

  /**
   * Core logic for creating orders from a checkout session.
   * Handles multi-seller splitting and snapshot creation.
   */
  async createOrdersFromCheckout(sessionId: string, tx?: any) {
    const prisma = tx || this.prisma;

    // 1. Fetch Session with details needed for snapshots
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        reservations: {
          include: {
            listing: {
              include: {
                product: {
                  include: { translations: true }
                }
              }
            }
          }
        }
      }
    });

    if (!session) throw new NotFoundException('Checkout session not found');
    if (!session.userId) throw new ConflictException('Guest checkout not supported for orders yet');

    // 2. Group items by Seller
    const itemsBySeller: Record<string, any[]> = {};
    for (const res of session.reservations) {
      const sellerId = res.listing.sellerId;
      if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
      
      // Get title snapshot based on session/user language (fallback to first translation)
      const title = res.listing.product.translations[0]?.title || 'Unknown Product';

      itemsBySeller[sellerId].push({
        listingId: res.listingId,
        productTitleSnapshot: title,
        quantity: res.quantity,
        priceCentsPerUnit: res.listing.buyNowPriceCents || 0,
      });
    }

    // 3. Create an Order for each seller group
    const orders: OrderView[] = [];
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const totalAmountCents = items.reduce((acc, item) => acc + (item.priceCentsPerUnit * item.quantity), 0);
      
      const order = await this.repository.create({
        userId: session.userId,
        sellerId,
        checkoutSessionId: session.id,
        totalAmountCents,
        currency: session.currency,
        shippingAddress: session.shippingAddress || {},
        items,
      }, prisma);

      this.metricsService.incrementOrders();

      await this.updateStatus(order.id, OrderStatus.CONFIRMED, { id: session.userId, role: 'SYSTEM' }, prisma);
      
      try {
        await this.shippingService.createShipment(order.id, prisma);
      } catch (err: any) {
        throw err;
      }
      orders.push(order);
    }

    return orders;
  }

  async updateStatus(
    orderId: string, 
    toStatus: OrderStatus, 
    actor: { id: string, role: 'BUYER' | 'SELLER' | 'SYSTEM' | 'ADMIN' },
    tx?: any
  ) {
    const prisma = tx || this.prisma;
    const order = await this.repository.findById(orderId, prisma);
    if (!order) throw new NotFoundException('Order not found');

    // 1. Validate State Transition
    assertOrderTransition(order.status, toStatus);

    // 2. Validate Role Permissions
    assertOrderRolePermission(actor.role, toStatus, order.status);

    // 3. Ownership Checks
    if (actor.role === 'BUYER' && order.userId !== actor.id) throw new ConflictException('Unauthorized');
    if (actor.role === 'SELLER' && order.seller.userId !== actor.id) {
      console.log(`Unauthorized SELLER: order.seller.userId=${order.seller.userId}, actor.id=${actor.id}`);
      throw new ConflictException('Unauthorized');
    }

    // 4. Update Status and Log Event
    const updated = await (tx ? (async () => {
      const res = await this.repository.updateStatus(orderId, toStatus, tx);
      await this.repository.createEvent(orderId, 'STATUS_CHANGED', { 
        from: order.status, 
        to: toStatus, 
        actorId: actor.id, 
        role: actor.role 
      }, tx);

      await this.handleStatusSideEffects(order, toStatus, tx);
      return res;
    })() : this.prisma.$transaction(async (innerTx) => {
      const res = await this.repository.updateStatus(orderId, toStatus, innerTx);
      await this.repository.createEvent(orderId, 'STATUS_CHANGED', { 
        from: order.status, 
        to: toStatus, 
        actorId: actor.id, 
        role: actor.role 
      }, innerTx);

      await this.handleStatusSideEffects(order, toStatus, innerTx);
      return res;
    }));

    // 5. Emit Events (e.g., for seller dashboard metrics or notifications)
    this.emitStatusEvents(updated, toStatus);

    return updated;
  }

  private async handleStatusSideEffects(order: any, toStatus: OrderStatus, tx: any) {
    // Escrow Automation
    if (toStatus === OrderStatus.CONFIRMED) {
      await this.escrowService.createHold({
        orderId: order.id,
        buyerId: order.userId,
        sellerId: order.sellerId,
        amountCents: order.totalAmountCents,
        currency: order.currency as any,
      }, tx);
    } else if (toStatus === OrderStatus.DELIVERED) {
      const escrow = await this.escrowService.getHoldByOrderId(order.id, tx);
      if (escrow) {
        await this.escrowService.releaseToSeller(escrow.id, { reason: 'Order Delivered' }, tx);
      }
    } else if (toStatus === OrderStatus.CANCELLED || toStatus === OrderStatus.REFUNDED) {
      const escrow = await this.escrowService.getHoldByOrderId(order.id, tx);
      if (escrow) {
        await this.escrowService.refundToBuyer(escrow.id, { reason: `Order ${toStatus}` }, tx);
      }
    } else if (toStatus === OrderStatus.RETURN_REQUESTED) {
      await this.refundService.requestRefund({
        orderId: order.id,
        buyerId: order.userId,
        sellerId: order.sellerId,
        amountCents: order.totalAmountCents,
        currency: order.currency as any,
        reason: 'Customer return request',
        idempotencyKey: `refund-init-${order.id}`,
      }, tx);
    }
  }

  private emitStatusEvents(updated: any, toStatus: OrderStatus) {
    if (toStatus === OrderStatus.CONFIRMED) {
      this.eventEmitter.emit('order.confirmed', { orderId: updated.id, sellerId: updated.sellerId });
    } else if (toStatus === OrderStatus.SHIPPED) {
      this.eventEmitter.emit('order.shipped', { orderId: updated.id, userId: updated.userId });
    } else if (toStatus === OrderStatus.DELIVERED) {
      this.eventEmitter.emit('order.delivered', { orderId: updated.id, userId: updated.userId });
    } else if (toStatus === OrderStatus.CANCELLED) {
      this.eventEmitter.emit('order.cancelled', { orderId: updated.id, userId: updated.userId, sellerId: updated.sellerId });
    } else if (toStatus === OrderStatus.RETURN_REQUESTED) {
      this.eventEmitter.emit('order.return_requested', { orderId: updated.id, sellerId: updated.sellerId });
    }
  }

  async getBuyerOrders(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async getSellerOrders(sellerId: string) {
    return this.repository.findBySellerId(sellerId);
  }

  async getOrderDetails(id: string) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
