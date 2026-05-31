import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EscrowStatus, Currency } from '@gbay/database';
import { IEscrowRepository, EscrowHoldView } from './escrow.types';

@Injectable()
export class PrismaEscrowRepository implements IEscrowRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async createHold(data: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    amountCents: number;
    currency: Currency;
  }, tx?: any): Promise<EscrowHoldView> {
    const prisma = tx || this.prisma;
    const hold = await prisma.escrowHold.create({
      data: {
        ...data,
        status: EscrowStatus.HELD,
        events: {
          create: {
            type: 'HOLD_CREATED',
            payload: data,
          },
        },
      },
    });
    return this.mapToView(hold);
  }

  async updateStatus(
    id: string,
    status: EscrowStatus,
    metadata?: any,
    tx?: any
  ): Promise<EscrowHoldView> {
    const prisma = tx || this.prisma;
    const updateData: any = { status };
    if (status === EscrowStatus.RELEASED_TO_SELLER) updateData.releasedAt = new Date();
    if (status === EscrowStatus.REFUNDED_TO_BUYER) updateData.refundedAt = new Date();
    if (status === EscrowStatus.DISPUTED) updateData.disputedAt = new Date();

    const hold = await prisma.escrowHold.update({
      where: { id },
      data: {
        ...updateData,
        events: {
          create: {
            type: status,
            payload: metadata,
          },
        },
      },
    });
    return this.mapToView(hold);
  }

  async findById(id: string, tx?: any): Promise<EscrowHoldView | null> {
    const prisma = tx || this.prisma;
    const hold = await prisma.escrowHold.findUnique({ where: { id } });
    return hold ? this.mapToView(hold) : null;
  }

  async findByOrderId(orderId: string, tx?: any): Promise<EscrowHoldView | null> {
    const prisma = tx || this.prisma;
    const hold = await prisma.escrowHold.findUnique({ where: { orderId } });
    return hold ? this.mapToView(hold) : null;
  }

  async findAll(filters?: {
    buyerId?: string;
    sellerId?: string;
    status?: EscrowStatus;
  }, tx?: any): Promise<EscrowHoldView[]> {
    const prisma = tx || this.prisma;
    const holds = await prisma.escrowHold.findMany({
      where: {
        buyerId: filters?.buyerId,
        sellerId: filters?.sellerId,
        status: filters?.status,
      },
      orderBy: { createdAt: 'desc' },
    });
    return holds.map((h: any) => this.mapToView(h));
  }

  private mapToView(hold: any): EscrowHoldView {
    return {
      id: hold.id,
      orderId: hold.orderId,
      buyerId: hold.buyerId,
      sellerId: hold.sellerId,
      amountCents: hold.amountCents,
      currency: hold.currency,
      status: hold.status,
      releasedAt: hold.releasedAt,
      refundedAt: hold.refundedAt,
      disputedAt: hold.disputedAt,
      createdAt: hold.createdAt,
      updatedAt: hold.updatedAt,
    };
  }
}
