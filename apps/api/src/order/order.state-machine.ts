import { ConflictException } from '@nestjs/common';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
}

/**
 * Valid transitions for an Order.
 * Map key is the current status, value is an array of allowed next statuses.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.CONFIRMED, OrderStatus.REFUNDED], // CONFIRMED if return rejected, REFUNDED if dispute resolved for buyer
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

/**
 * Asserts that an order can transition from currentStatus to toStatus.
 * Throws ConflictException if the transition is invalid.
 */
export function assertOrderTransition(currentStatus: OrderStatus, toStatus: OrderStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  
  if (!allowed || !allowed.includes(toStatus)) {
    throw new ConflictException({
      code: 'ORDER_INVALID_STATE_TRANSITION',
      message: `Cannot transition order from ${currentStatus} to ${toStatus}`,
      currentStatus,
      toStatus,
    });
  }
}

/**
 * Validates which role can perform which transition.
 */
export function assertOrderRolePermission(
  role: 'BUYER' | 'SELLER' | 'SYSTEM' | 'ADMIN',
  toStatus: OrderStatus,
  currentStatus: OrderStatus
) {
  // 1. Buyer can only Cancel (if PENDING/CONFIRMED) or Request Return (if DELIVERED)
  if (role === 'BUYER') {
    const buyerAllowed = [OrderStatus.CANCELLED, OrderStatus.RETURN_REQUESTED];
    if (!buyerAllowed.includes(toStatus)) {
      throw new ConflictException(`Buyer not allowed to set status to ${toStatus}`);
    }
    
    if (toStatus === OrderStatus.CANCELLED && currentStatus !== OrderStatus.PENDING && currentStatus !== OrderStatus.CONFIRMED) {
      throw new ConflictException('Buyer can only cancel orders in PENDING or CONFIRMED state');
    }
  }

  // 2. Seller can only mark as SHIPPED
  if (role === 'SELLER') {
    if (toStatus !== OrderStatus.SHIPPED) {
      throw new ConflictException(`Seller not allowed to set status to ${toStatus}`);
    }
  }

  // 3. Admin/System can do any valid transition (handled by assertOrderTransition)
}
