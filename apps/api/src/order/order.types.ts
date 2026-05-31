import { OrderStatus } from './order.state-machine';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderItemInput {
  listingId: string;
  productTitleSnapshot: string;
  quantity: number;
  priceCentsPerUnit: number;
}

export interface CreateOrderInput {
  userId: string;
  sellerId: string;
  checkoutSessionId?: string;
  totalAmountCents: number;
  currency: string;
  shippingAddress: any;
  items: OrderItemInput[];
}

export interface OrderView {
  id: string;
  userId: string;
  sellerId: string;
  checkoutSessionId: string | null;
  status: OrderStatus;
  totalAmountCents: number;
  currency: string;
  shippingAddress: any;
  createdAt: Date;
  updatedAt: Date;
  items?: any[];
  events?: any[];
  seller?: any;
}

export interface OrderRepository {
  create(input: CreateOrderInput, tx?: any): Promise<OrderView>;
  findById(id: string, tx?: any): Promise<OrderView | null>;
  findByUserId(userId: string): Promise<OrderView[]>;
  findBySellerId(sellerId: string): Promise<OrderView[]>;
  updateStatus(id: string, status: OrderStatus, tx?: any): Promise<OrderView>;
  createEvent(orderId: string, type: string, payload?: any, tx?: any): Promise<void>;
}
