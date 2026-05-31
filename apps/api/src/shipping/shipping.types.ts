import { ShipmentStatus } from '@gbay/database';

export const SHIPPING_REPOSITORY = Symbol('SHIPPING_REPOSITORY');

export interface ShipmentView {
  id: string;
  orderId: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  status: ShipmentStatus;
  labelUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingRepository {
  create(data: {
    orderId: string;
    trackingNumber?: string;
    carrier?: string;
    labelUrl?: string;
  }, tx?: any): Promise<ShipmentView>;

  updateStatus(
    id: string,
    status: ShipmentStatus,
    data?: {
      trackingNumber?: string;
      carrier?: string;
    },
    tx?: any
  ): Promise<ShipmentView>;

  findById(id: string, tx?: any): Promise<ShipmentView | null>;
  findByOrderId(orderId: string, tx?: any): Promise<ShipmentView | null>;
}
