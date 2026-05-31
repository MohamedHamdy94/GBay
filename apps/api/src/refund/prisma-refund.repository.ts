import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RefundStatus, Currency } from '@gbay/database';
import { RefundRepository, CreateRefundInput, RefundView } from './refund.types';

@Injectable()
export class PrismaRefundRepository implements RefundRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(input: CreateRefundInput, tx?: any): Promise<RefundView> {
    const prisma = tx || this.prisma;
    const refund = await prisma.refund.create({
      data: {
        orderId: input.orderId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        amountCents: input.amountCents,
        currency: input.currency,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        status: RefundStatus.REQUESTED,
        events: {
          create: {
            type: 'REQUESTED',
            payload: { reason: input.reason },
          },
        },
      },
      include: { events: true },
    });
    return this.mapToView(refund);
  }

  async findById(id: string, tx?: any): Promise<RefundView | null> {
    const prisma = tx || this.prisma;
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return refund ? this.mapToView(refund) : null;
  }

  async findByOrderId(orderId: string, tx?: any): Promise<RefundView | null> {
    const prisma = tx || this.prisma;
    const refund = await prisma.refund.findUnique({
      where: { orderId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return refund ? this.mapToView(refund) : null;
  }

  async findByBuyerId(buyerId: string, tx?: any): Promise<RefundView[]> {
    const prisma = tx || this.prisma;
    const refunds = await prisma.refund.findMany({
      where: { buyerId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return refunds.map((r: any) => this.mapToView(r));
  }

  async findBySellerId(sellerId: string, tx?: any): Promise<RefundView[]> {
    const prisma = tx || this.prisma;
    const refunds = await prisma.refund.findMany({
      where: { sellerId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return refunds.map((r: any) => this.mapToView(r));
  }

  async findAll(filters?: { status?: RefundStatus; buyerId?: string; sellerId?: string }, tx?: any): Promise<RefundView[]> {
    const prisma = tx || this.prisma;
    const refunds = await prisma.refund.findMany({
      where: {
        status: filters?.status,
        buyerId: filters?.buyerId,
        sellerId: filters?.sellerId,
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return refunds.map((r: any) => this.mapToView(r));
  }

  async updateStatus(id: string, status: RefundStatus, metadata?: { actor?: string; role?: string; payload?: any }, tx?: any): Promise<RefundView> {
    const prisma = tx || this.prisma;
    const updateData: any = { status };
    if (status === RefundStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const refund = await prisma.refund.update({
      where: { id },
      data: {
        ...updateData,
        events: {
          create: {
            type: status,
            actor: metadata?.actor,
            actorRole: metadata?.role,
            payload: metadata?.payload,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.mapToView(refund);
  }

  async createEvent(refundId: string, type: string, actor?: string, role?: string, payload?: any, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.refundEvent.create({
      data: {
        refundId,
        type,
        actor,
        actorRole: role,
        payload,
      },
    });
  }

  private mapToView(refund: any): RefundView {
    return {
      id: refund.id,
      orderId: refund.orderId,
      buyerId: refund.buyerId,
      sellerId: refund.sellerId,
      amountCents: refund.amountCents,
      currency: refund.currency,
      reason: refund.reason,
      status: refund.status,
      idempotencyKey: refund.idempotencyKey,
      adminNotes: refund.adminNotes,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
      completedAt: refund.completedAt,
      events: refund.events?.map((e: any) => ({
        id: e.id,
        refundId: e.refundId,
        type: e.type,
        actor: e.actor,
        actorRole: e.actorRole,
        payload: e.payload,
        createdAt: e.createdAt,
      })),
    };
  }
}
