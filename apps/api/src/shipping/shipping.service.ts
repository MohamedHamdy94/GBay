import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ShipmentStatus } from '@gbay/database';
import { SHIPPING_REPOSITORY, IShippingRepository, ShipmentView } from './shipping.types';
import { assertShipmentTransition } from './shipping.state-machine';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepo: IShippingRepository
  ) {}

  async createShipment(orderId: string, tx?: any): Promise<ShipmentView> {
    const existing = await this.shippingRepo.findByOrderId(orderId, tx);
    if (existing) return existing;
    return this.shippingRepo.create({ orderId }, tx);
  }

  async markAsShipped(orderId: string, trackingNumber: string, carrier: string, tx?: any): Promise<ShipmentView> {
    let shipment = await this.shippingRepo.findByOrderId(orderId, tx);
    if (!shipment) {
      shipment = await this.shippingRepo.create({ orderId }, tx);
    }

    assertShipmentTransition(shipment.status, ShipmentStatus.SHIPPED);
    
    return this.shippingRepo.updateStatus(shipment.id, ShipmentStatus.SHIPPED, {
      trackingNumber,
      carrier,
    }, tx);
  }

  async updateShipmentStatus(orderId: string, status: ShipmentStatus, tx?: any): Promise<ShipmentView> {
    const shipment = await this.shippingRepo.findByOrderId(orderId, tx);
    if (!shipment) throw new NotFoundException(`Shipment for order ${orderId} not found`);

    assertShipmentTransition(shipment.status, status);
    
    return this.shippingRepo.updateStatus(shipment.id, status, undefined, tx);
  }

  async getShipmentByOrderId(orderId: string, tx?: any): Promise<ShipmentView | null> {
    return this.shippingRepo.findByOrderId(orderId, tx);
  }
}
