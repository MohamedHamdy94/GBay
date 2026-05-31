import { RefundStatus, Currency } from '@gbay/database';

export const REFUND_REPOSITORY = Symbol('REFUND_REPOSITORY');

export interface RefundView {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  currency: Currency;
  reason: string | null;
  status: RefundStatus;
  idempotencyKey: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  events?: RefundEventView[];
}

export interface RefundEventView {
  id: string;
  refundId: string;
  type: string;
  actor: string | null;
  actorRole: string | null;
  payload: any;
  createdAt: Date;
}

export interface CreateRefundInput {
  orderId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  currency: Currency;
  reason?: string;
  idempotencyKey: string;
}

export interface RefundRepository {
  create(input: CreateRefundInput, tx?: any): Promise<RefundView>;
  findById(id: string, tx?: any): Promise<RefundView | null>;
  findByOrderId(orderId: string, tx?: any): Promise<RefundView | null>;
  findByBuyerId(buyerId: string, tx?: any): Promise<RefundView[]>;
  findBySellerId(sellerId: string, tx?: any): Promise<RefundView[]>;
  findAll(filters?: { status?: RefundStatus; buyerId?: string; sellerId?: string }, tx?: any): Promise<RefundView[]>;
  updateStatus(id: string, status: RefundStatus, metadata?: { actor?: string; role?: string; payload?: any }, tx?: any): Promise<RefundView>;
  createEvent(refundId: string, type: string, actor?: string, role?: string, payload?: any, tx?: any): Promise<void>;
}
