import { ThreadStatus } from '@gbay/database';

export interface MessageView {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

export interface MessageThreadView {
  id: string;
  orderId?: string | null;
  disputeId?: string | null;
  buyerId: string;
  sellerId: string;
  subject?: string | null;
  status: ThreadStatus;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageView[];
  lastMessage?: MessageView | null;
}

export interface CreateThreadInput {
  orderId?: string;
  disputeId?: string;
  subject?: string;
  body: string; // Initial message
}

export interface SendMessageInput {
  body: string;
}

export const MESSAGING_REPOSITORY = 'MESSAGING_REPOSITORY';

export interface MessagingRepository {
  createThread(input: CreateThreadInput & { buyerId: string; sellerId: string }, tx?: any): Promise<MessageThreadView>;
  addMessage(threadId: string, senderId: string, body: string, tx?: any): Promise<MessageView>;
  findThreadById(id: string, tx?: any): Promise<MessageThreadView | null>;
  findThreadsByUser(userId: string, tx?: any): Promise<MessageThreadView[]>;
  updateThreadStatus(id: string, status: ThreadStatus, tx?: any): Promise<MessageThreadView>;
}
