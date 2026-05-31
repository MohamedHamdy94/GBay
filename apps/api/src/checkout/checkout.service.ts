import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CHECKOUT_REPOSITORY, CheckoutRepository, CheckoutStatus } from './checkout.types';
import { CartService } from '../cart/cart.service';
import { CommerceService } from '../commerce/commerce.service';
import { InitiateCheckoutDto } from './dto';

import { OrderService } from '../order/order.service';

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CHECKOUT_REPOSITORY) private readonly repository: CheckoutRepository,
    @Inject(CartService) private readonly cartService: CartService,
    @Inject(CommerceService) private readonly commerceService: CommerceService,
    @Inject(OrderService) private readonly orderService: OrderService,
    // @InjectQueue('checkout-timeout') private readonly checkoutQueue: Queue,
  ) {
    console.log('CheckoutService initialized. OrderService is:', this.orderService ? 'DEFINED' : 'UNDEFINED');
  }

  async initiateCheckout(userId: string | undefined, sessionToken: string | undefined, dto: InitiateCheckoutDto) {
    // 1. Check for existing session (Idempotency)
    const existing = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
    if (existing) return existing;

    // 2. Get Cart
    const cart = await this.cartService.getOrCreateCart(userId, sessionToken);
    if (cart.id !== dto.cartId) throw new ConflictException('Cart mismatch');
    if (cart.items.length === 0) throw new ConflictException('Cart is empty');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    return await this.prisma.$transaction(async (tx) => {
      const listingIds = cart.items.map(item => item.listingId);

      // 3. ROW-LEVEL LOCKING (Critical)
      // Use raw SQL to lock listings for update
      await tx.$executeRawUnsafe(
        `SELECT id FROM "gbay"."Listing" WHERE id = ANY($1) FOR UPDATE`,
        listingIds
      );

      // 4. SAFETY CHECK (Re-verify stock after lock)
      const freshListings = await tx.listing.findMany({
        where: { id: { in: listingIds } }
      });

      let totalAmountCents = 0;
      for (const item of cart.items) {
        const listing = freshListings.find(l => l.id === item.listingId);
        if (!listing || listing.quantityAvailable < item.quantity) {
          throw new ConflictException({
            code: 'INSUFFICIENT_STOCK',
            listingId: item.listingId,
            available: listing?.quantityAvailable ?? 0,
            requested: item.quantity
          });
        }
        totalAmountCents += (listing.buyNowPriceCents || 0) * item.quantity;
      }

      // 5. Create Checkout Session
      const session = await this.repository.create({
        userId,
        cartId: cart.id,
        idempotencyKey: dto.idempotencyKey,
        totalAmountCents,
        currency: 'EUR',
        expiresAt,
        shippingAddress: dto.shippingAddress,
      }, tx);

      // 6. Create Reservations linked to Session
      // We manually update the reservations within the transaction or just create them
      for (const item of cart.items) {
        // We can't easily use commerceService inside tx without passing tx
        // So we'll implement the reservation logic here surgically
        await tx.inventoryReservation.create({
          data: {
            listingId: item.listingId,
            userId: userId || 'GUEST', // We use 'GUEST' if no userId
            quantity: item.quantity,
            status: 'ACTIVE',
            idempotencyKey: `checkout-${session.id}-${item.listingId}`,
            expiresAt,
            checkoutSessionId: session.id,
          }
        });

        // Update listing quantity
        const listing = freshListings.find(l => l.id === item.listingId)!;
        const newAvailable = listing.quantityAvailable - item.quantity;
        await tx.listing.update({
          where: { id: item.listingId },
          data: {
            quantityAvailable: newAvailable,
            status: newAvailable === 0 ? 'SOLD' : undefined,
            version: { increment: 1 },
          }
        });
      }

      // 7. Schedule Expiration Job (BullMQ)
      // Note: We schedule AFTER the transaction succeeds in the service caller or here?
      // Best is to use a hook, but for now we'll do it after the await transaction.
      return session;
    }, { timeout: 20000 }).then(async (session) => {
      try {
        // @ts-ignore: checkoutQueue is optionally injected/commented out for now
        if (this['checkoutQueue']) {
          // @ts-ignore
          await this.checkoutQueue.add(
            'expire-session',
            { sessionId: session.id },
            { 
              delay: 15 * 60 * 1000, 
              jobId: session.id 
            }
          );
        }
      } catch (e: any) {
        console.warn('Failed to schedule session expiration (BullMQ/Redis might be down):', e.message);
      }
      return session;
    });
  }

  async confirmCheckout(userId: string | undefined, sessionId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const session = await tx.checkoutSession.findUnique({
        where: { id: sessionId },
        include: { reservations: true }
      });

      if (!session) throw new NotFoundException('Session not found');
      if (session.status !== 'PENDING') throw new ConflictException(`Invalid session status: ${session.status}`);
      if (session.userId && session.userId !== userId) throw new ConflictException('Unauthorized');

      // 1. Confirm Session
      await tx.checkoutSession.update({
        where: { id: sessionId },
        data: { status: 'CONFIRMED' }
      });

      // 2. Consume Reservations
      await tx.inventoryReservation.updateMany({
        where: { checkoutSessionId: sessionId },
        data: { 
          status: 'CONSUMED',
          consumedAt: new Date()
        }
      });

      // 3. Create Orders
      const orders = await this.orderService.createOrdersFromCheckout(sessionId, tx);

      // 4. Clear Cart
      await tx.cartItem.deleteMany({
        where: { cartId: session.cartId }
      });

      return { success: true, orderIds: orders.map(o => o.id) };
    }, { timeout: 20000 });
  }

  async getSession(id: string) {
    return this.repository.findById(id);
  }
}
