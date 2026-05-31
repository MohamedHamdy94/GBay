import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import { CheckoutRepository, CheckoutSessionView, CreateCheckoutSessionInput, CheckoutStatus } from './checkout.types';

@Injectable()
export class PrismaCheckoutRepository implements CheckoutRepository {
  private readonly prisma = new PrismaClient();

  async findById(id: string): Promise<CheckoutSessionView | null> {
    return this.prisma.checkoutSession.findUnique({
      where: { id },
    }) as unknown as CheckoutSessionView | null;
  }

  async findByIdempotencyKey(key: string): Promise<CheckoutSessionView | null> {
    return this.prisma.checkoutSession.findUnique({
      where: { idempotencyKey: key },
    }) as unknown as CheckoutSessionView | null;
  }

  async create(input: CreateCheckoutSessionInput, tx?: any): Promise<CheckoutSessionView> {
    const prisma = tx || this.prisma;
    return prisma.checkoutSession.create({
      data: {
        userId: input.userId,
        cartId: input.cartId,
        status: 'PENDING',
        idempotencyKey: input.idempotencyKey,
        totalAmountCents: input.totalAmountCents,
        currency: input.currency as any,
        expiresAt: input.expiresAt,
        shippingAddress: input.shippingAddress,
      },
    }) as unknown as CheckoutSessionView;
  }

  async updateStatus(id: string, status: CheckoutStatus, tx?: any): Promise<CheckoutSessionView> {
    const prisma = tx || this.prisma;
    return prisma.checkoutSession.update({
      where: { id },
      data: { status: status as any },
    }) as unknown as CheckoutSessionView;
  }
}
