export const COMMERCE_REPOSITORY = Symbol('COMMERCE_REPOSITORY');

export enum InventoryReservationStatus {
  ACTIVE = 'ACTIVE',
  CONSUMED = 'CONSUMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export interface InventoryReservationView {
  id: string;
  listingId: string;
  userId: string;
  quantity: number;
  status: InventoryReservationStatus;
  idempotencyKey: string;
  expiresAt: Date;
  consumedAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReserveItemInput {
  listingId: string;
  userId: string;
  quantity: number;
  idempotencyKey: string;
  expiresInMinutes?: number;
}

export interface CommerceRepository {
  reserveItem(input: ReserveItemInput): Promise<InventoryReservationView>;
  findReservationById(id: string): Promise<InventoryReservationView | null>;
  findReservationByIdempotencyKey(key: string): Promise<InventoryReservationView | null>;
  releaseReservation(id: string): Promise<void>;
  consumeReservation(id: string): Promise<void>;
}
