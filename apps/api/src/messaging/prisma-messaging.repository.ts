import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ThreadStatus } from '@gbay/database';
import { MessagingRepository, MessageThreadView, MessageView, CreateThreadInput } from './messaging.types';

@Injectable()
export class PrismaMessagingRepository implements MessagingRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async createThread(input: CreateThreadInput & { buyerId: string; sellerId: string }, tx?: any): Promise<MessageThreadView> {
    const prisma = tx || this.prisma;
    const thread = await prisma.messageThread.create({
      data: {
        orderId: input.orderId,
        disputeId: input.disputeId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        subject: input.subject,
        status: ThreadStatus.OPEN,
        messages: {
          create: {
            senderId: input.buyerId, // Initially created by buyer usually
            body: input.body,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return this.mapThreadToView(thread);
  }

  async addMessage(threadId: string, senderId: string, body: string, tx?: any): Promise<MessageView> {
    const prisma = tx || this.prisma;
    const msg = await prisma.message.create({
      data: {
        threadId,
        senderId,
        body,
      },
    });
    return this.mapMessageToView(msg);
  }

  async findThreadById(id: string, tx?: any): Promise<MessageThreadView | null> {
    const prisma = tx || this.prisma;
    const thread = await prisma.messageThread.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    return thread ? this.mapThreadToView(thread) : null;
  }

  async findThreadsByUser(userId: string, tx?: any): Promise<MessageThreadView[]> {
    const prisma = tx || this.prisma;
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { seller: { userId: userId } },
        ],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return threads.map((t: any) => this.mapThreadToView(t));
  }

  async updateThreadStatus(id: string, status: ThreadStatus, tx?: any): Promise<MessageThreadView> {
    const prisma = tx || this.prisma;
    const thread = await prisma.messageThread.update({
      where: { id },
      data: { status },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return this.mapThreadToView(thread);
  }

  private mapThreadToView(thread: any): MessageThreadView {
    return {
      id: thread.id,
      orderId: thread.orderId,
      disputeId: thread.disputeId,
      buyerId: thread.buyerId,
      sellerId: thread.sellerId,
      subject: thread.subject,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages?.map((m: any) => this.mapMessageToView(m)),
      lastMessage: thread.messages && thread.messages.length > 0 ? this.mapMessageToView(thread.messages[0]) : null,
    };
  }

  private mapMessageToView(msg: any): MessageView {
    return {
      id: msg.id,
      threadId: msg.threadId,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt,
    };
  }
}
