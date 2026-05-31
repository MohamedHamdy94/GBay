import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DisputeStatus, DisputeReason } from '@gbay/database';
import { DisputeRepository, CreateDisputeInput, DisputeView, DisputeMessageView } from './dispute.types';

@Injectable()
export class PrismaDisputeRepository implements DisputeRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(input: CreateDisputeInput, tx?: any): Promise<DisputeView> {
    const prisma = tx || this.prisma;
    const dispute = await prisma.dispute.create({
      data: {
        refundId: input.refundId,
        reason: input.reason,
        description: input.description,
        evidence: input.evidence,
        status: DisputeStatus.OPEN,
      },
      include: { messages: true },
    });
    return this.mapToView(dispute);
  }

  async findById(id: string, tx?: any): Promise<DisputeView | null> {
    const prisma = tx || this.prisma;
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return dispute ? this.mapToView(dispute) : null;
  }

  async findByRefundId(refundId: string, tx?: any): Promise<DisputeView | null> {
    const prisma = tx || this.prisma;
    const dispute = await prisma.dispute.findUnique({
      where: { refundId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return dispute ? this.mapToView(dispute) : null;
  }

  async findAll(filters?: { status?: DisputeStatus }, tx?: any): Promise<DisputeView[]> {
    const prisma = tx || this.prisma;
    const disputes = await prisma.dispute.findMany({
      where: {
        status: filters?.status,
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return disputes.map((d: any) => this.mapToView(d));
  }

  async updateStatus(id: string, status: DisputeStatus, resolution?: string, tx?: any): Promise<DisputeView> {
    const prisma = tx || this.prisma;
    const updateData: any = { status, resolution };
    if ([DisputeStatus.RESOLVED_BUYER, DisputeStatus.RESOLVED_SELLER, DisputeStatus.CLOSED].includes(status as any)) {
      updateData.resolvedAt = new Date();
    }

    const dispute = await prisma.dispute.update({
      where: { id },
      data: updateData,
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return this.mapToView(dispute);
  }

  async addMessage(disputeId: string, senderId: string, message: string, tx?: any): Promise<DisputeMessageView> {
    const prisma = tx || this.prisma;
    const msg = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        message,
      },
    });
    return {
      id: msg.id,
      disputeId: msg.disputeId,
      senderId: msg.senderId,
      message: msg.message,
      createdAt: msg.createdAt,
    };
  }

  private mapToView(dispute: any): DisputeView {
    return {
      id: dispute.id,
      refundId: dispute.refundId,
      reason: dispute.reason,
      description: dispute.description,
      evidence: dispute.evidence,
      status: dispute.status,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      resolvedAt: dispute.resolvedAt,
      messages: dispute.messages?.map((m: any) => ({
        id: m.id,
        disputeId: m.disputeId,
        senderId: m.senderId,
        message: m.message,
        createdAt: m.createdAt,
      })),
    };
  }
}
