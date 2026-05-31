import { ConflictException } from '@nestjs/common';
import { ShipmentStatus } from '@gbay/database';

const VALID_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PROCESSING]: [ShipmentStatus.SHIPPED],
  [ShipmentStatus.SHIPPED]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED],
  [ShipmentStatus.DELIVERED]: [],
};

export function assertShipmentTransition(from: ShipmentStatus, to: ShipmentStatus) {
  const allowed = VALID_SHIPMENT_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new ConflictException(`Cannot transition shipment from ${from} to ${to}`);
  }
}
