import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderRepository, OrderView, CreateOrderInput } from './order.types';
import { OrderStatus } from './order.state-machine';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput, tx?: any): Promise<OrderView> {
    const prisma = tx || this.prisma;
    return prisma.order.create({
      data: {
        userId: input.userId,
        sellerId: input.sellerId,
        checkoutSessionId: input.checkoutSessionId,
        totalAmountCents: input.totalAmountCents,
        currency: input.currency as any,
        shippingAddress: input.shippingAddress,
        items: {
          create: input.items.map(item => ({
            listingId: item.listingId,
            productTitleSnapshot: item.productTitleSnapshot,
            quantity: item.quantity,
            priceCentsPerUnit: item.priceCentsPerUnit,
          })),
        },
      },
      include: {
        items: true,
      },
    }) as unknown as OrderView;
  }

  async findById(id: string, tx?: any): Promise<OrderView | null> {
    const prisma = tx || this.prisma;
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: true,
        seller: true,
      },
    }) as unknown as OrderView | null;
  }

  async findByUserId(userId: string): Promise<OrderView[]> {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as OrderView[];
  }

  async findBySellerId(sellerId: string): Promise<OrderView[]> {
    return this.prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as OrderView[];
  }

  async updateStatus(id: string, status: OrderStatus, tx?: any): Promise<OrderView> {
    const prisma = tx || this.prisma;
    return prisma.order.update({
      where: { id },
      data: { status: status as any },
    }) as unknown as OrderView;
  }

  async createEvent(orderId: string, type: string, payload?: any, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.orderEvent.create({
      data: {
        orderId,
        type,
        payload,
      },
    });
  }
}
