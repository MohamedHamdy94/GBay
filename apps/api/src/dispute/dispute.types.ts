import { DisputeStatus, DisputeReason } from '@gbay/database';

export const DISPUTE_REPOSITORY = Symbol('DISPUTE_REPOSITORY');

export interface DisputeView {
  id: string;
  refundId: string;
  reason: DisputeReason;
  description: string | null;
  evidence: any;
  status: DisputeStatus;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  messages?: DisputeMessageView[];
}

export interface DisputeMessageView {
  id: string;
  disputeId: string;
  senderId: string;
  message: string;
  createdAt: Date;
}

export interface CreateDisputeInput {
  refundId: string;
  reason: DisputeReason;
  description?: string;
  evidence?: any;
}

export interface DisputeRepository {
  create(input: CreateDisputeInput, tx?: any): Promise<DisputeView>;
  findById(id: string, tx?: any): Promise<DisputeView | null>;
  findByRefundId(refundId: string, tx?: any): Promise<DisputeView | null>;
  findAll(filters?: { status?: DisputeStatus }, tx?: any): Promise<DisputeView[]>;
  updateStatus(id: string, status: DisputeStatus, resolution?: string, tx?: any): Promise<DisputeView>;
  addMessage(disputeId: string, senderId: string, message: string, tx?: any): Promise<DisputeMessageView>;
}
