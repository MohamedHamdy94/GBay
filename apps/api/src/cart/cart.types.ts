export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export enum CartStatus {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED',
}

export interface CartItemView {
  id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  addedAt: Date;
  listing?: any; // To include listing details if needed
}

export interface CartView {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  status: CartStatus;
  expiresAt: Date;
  items: CartItemView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCartItemInput {
  cartId: string;
  listingId: string;
  quantity: number;
}

export interface CartRepository {
  findActiveByUserId(userId: string): Promise<CartView | null>;
  findActiveBySessionToken(sessionToken: string): Promise<CartView | null>;
  createCart(data: { userId?: string; sessionToken?: string; expiresAt: Date }): Promise<CartView>;
  addItem(input: AddCartItemInput): Promise<CartItemView>;
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItemView>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  mergeCarts(sourceCartId: string, targetCartId: string): Promise<void>;
  markAsAbandoned(olderThan: Date): Promise<number>;
}
