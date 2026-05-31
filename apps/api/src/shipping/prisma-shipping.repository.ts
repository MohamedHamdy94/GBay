import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ShipmentStatus } from '@gbay/database';
import { IShippingRepository, ShipmentView } from './shipping.types';

@Injectable()
export class PrismaShippingRepository implements IShippingRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(data: {
    orderId: string;
    trackingNumber?: string;
    carrier?: string;
    labelUrl?: string;
  }, tx?: any): Promise<ShipmentView> {
    const prisma = tx || this.prisma;
    const shipment = await prisma.shipment.create({
      data: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        labelUrl: data.labelUrl,
        status: ShipmentStatus.PROCESSING,
      },
    });
    return this.mapToView(shipment);
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    data?: {
      trackingNumber?: string;
      carrier?: string;
    },
    tx?: any
  ): Promise<ShipmentView> {
    const prisma = tx || this.prisma;
    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        ...(data?.trackingNumber && { trackingNumber: data.trackingNumber }),
        ...(data?.carrier && { carrier: data.carrier }),
      },
    });
    return this.mapToView(shipment);
  }

  async findById(id: string, tx?: any): Promise<ShipmentView | null> {
    const prisma = tx || this.prisma;
    const shipment = await prisma.shipment.findUnique({ where: { id } });
    return shipment ? this.mapToView(shipment) : null;
  }

  async findByOrderId(orderId: string, tx?: any): Promise<ShipmentView | null> {
    const prisma = tx || this.prisma;
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    return shipment ? this.mapToView(shipment) : null;
  }

  private mapToView(shipment: any): ShipmentView {
    return {
      id: shipment.id,
      orderId: shipment.orderId,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      labelUrl: shipment.labelUrl,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }
}
