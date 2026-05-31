import { EscrowStatus, Currency } from '@gbay/database';

export const ESCROW_REPOSITORY = Symbol('ESCROW_REPOSITORY');

export interface EscrowHoldView {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  currency: Currency;
  status: EscrowStatus;
  releasedAt?: Date;
  refundedAt?: Date;
  disputedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowEventView {
  id: string;
  escrowHoldId: string;
  type: string;
  payload?: any;
  createdAt: Date;
}

export interface IEscrowRepository {
  createHold(data: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    amountCents: number;
    currency: Currency;
  }, tx?: any): Promise<EscrowHoldView>;

  updateStatus(
    id: string,
    status: EscrowStatus,
    metadata?: any,
    tx?: any
  ): Promise<EscrowHoldView>;

  findById(id: string, tx?: any): Promise<EscrowHoldView | null>;
  findByOrderId(orderId: string, tx?: any): Promise<EscrowHoldView | null>;
  findAll(filters?: {
    buyerId?: string;
    sellerId?: string;
    status?: EscrowStatus;
  }, tx?: any): Promise<EscrowHoldView[]>;
}
