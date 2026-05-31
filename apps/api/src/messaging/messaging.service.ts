import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ThreadStatus } from '@gbay/database';
import { MESSAGING_REPOSITORY, MessagingRepository, MessageThreadView, MessageView, CreateThreadInput } from './messaging.types';
import { OrderService } from '../order/order.service';
import { DisputeService } from '../dispute/dispute.service';
import { RefundService } from '../refund/refund.service';
import { SellerService } from '../seller/seller.service';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGING_REPOSITORY) private readonly messagingRepo: MessagingRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => OrderService)) private readonly orderService: OrderService,
    @Inject(forwardRef(() => DisputeService)) private readonly disputeService: DisputeService,
    @Inject(forwardRef(() => RefundService)) private readonly refundService: RefundService,
    @Inject(forwardRef(() => SellerService)) private readonly sellerService: SellerService,
    @Inject(MessagingGateway)
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async createThread(input: CreateThreadInput, buyerId: string): Promise<MessageThreadView> {
    let sellerId: string;
    let sellerUserId: string;

    if (input.orderId) {
      const order = await this.orderService.getOrderDetails(input.orderId);
      if (order.userId !== buyerId) {
        throw new ForbiddenException('Not your order');
      }
      sellerId = order.sellerId;
      sellerUserId = order.seller.userId;
    } else if (input.disputeId) {
      const dispute = await this.disputeService.getDispute(input.disputeId);
      const refund = await this.refundService.getRefund(dispute.refundId);
      if (refund.buyerId !== buyerId) {
        throw new ForbiddenException('Not your dispute');
      }
      sellerId = refund.sellerId;
      const sellerProfile = await this.sellerService.getSeller(sellerId);
      sellerUserId = sellerProfile.userId;
    } else {
      throw new ConflictException('Thread must be linked to an order or dispute');
    }

    const thread = await this.messagingRepo.createThread({ ...input, buyerId, sellerId });

    // Notify seller
    this.messagingGateway.emitNewThread(sellerUserId, thread);

    return thread;
  }

  async getMyThreads(userId: string): Promise<MessageThreadView[]> {
    return this.messagingRepo.findThreadsByUser(userId);
  }

  async getThreadDetails(threadId: string, userId: string): Promise<MessageThreadView> {
    const thread = await this.messagingRepo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    await this.validateThreadAccess(thread, userId);

    return thread;
  }

  async sendMessage(threadId: string, senderId: string, body: string): Promise<MessageView> {
    const thread = await this.messagingRepo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    if (thread.status === ThreadStatus.CLOSED) throw new ConflictException('Thread is closed');

    await this.validateThreadAccess(thread, senderId);

    const message = await this.messagingRepo.addMessage(threadId, senderId, body);

    // Notify the other party
    let otherUserId: string;
    if (thread.buyerId === senderId) {
      const sellerProfile = await this.sellerService.getSeller(thread.sellerId);
      otherUserId = sellerProfile.userId;
    } else {
      otherUserId = thread.buyerId;
    }

    this.messagingGateway.emitNewMessage(otherUserId, message);
    this.eventEmitter.emit('message.received', { threadId, senderId, recipientId: otherUserId, body });

    return message;
  }

  async closeThread(threadId: string, userId: string): Promise<MessageThreadView> {
    const thread = await this.messagingRepo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    await this.validateThreadAccess(thread, userId);

    return this.messagingRepo.updateThreadStatus(threadId, ThreadStatus.CLOSED);
  }

  private async validateThreadAccess(thread: MessageThreadView, userId: string) {
    // Admin bypass could be added here
    if (thread.buyerId === userId) return;

    const seller = await this.sellerService.getSellerByUserId(userId);
    if (seller && thread.sellerId === seller.id) return;

    throw new ForbiddenException('You do not have access to this thread');
  }
}
