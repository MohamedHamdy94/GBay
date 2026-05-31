export const CHECKOUT_REPOSITORY = Symbol('CHECKOUT_REPOSITORY');

export enum CheckoutStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface CheckoutSessionView {
  id: string;
  userId: string | null;
  cartId: string;
  status: CheckoutStatus;
  idempotencyKey: string;
  totalAmountCents: number;
  currency: string;
  shippingAddress: any | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckoutSessionInput {
  userId?: string;
  cartId: string;
  idempotencyKey: string;
  totalAmountCents: number;
  currency: string;
  shippingAddress: any;
  expiresAt: Date;
}

export interface CheckoutRepository {
  findById(id: string): Promise<CheckoutSessionView | null>;
  findByIdempotencyKey(key: string): Promise<CheckoutSessionView | null>;
  create(input: CreateCheckoutSessionInput, tx?: any): Promise<CheckoutSessionView>;
  updateStatus(id: string, status: CheckoutStatus, tx?: any): Promise<CheckoutSessionView>;
}
