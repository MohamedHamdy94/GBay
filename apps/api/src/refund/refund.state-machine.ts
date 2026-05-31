import { ConflictException } from '@nestjs/common';
import { RefundStatus } from '@gbay/database';

/**
 * Valid transitions for a Refund.
 */
const VALID_REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  [RefundStatus.REQUESTED]: [RefundStatus.APPROVED, RefundStatus.REJECTED, RefundStatus.CANCELLED],
  [RefundStatus.APPROVED]: [RefundStatus.PROCESSING, RefundStatus.CANCELLED],
  [RefundStatus.REJECTED]: [RefundStatus.ESCALATED],
  [RefundStatus.ESCALATED]: [RefundStatus.APPROVED, RefundStatus.REJECTED, RefundStatus.CANCELLED],
  [RefundStatus.PROCESSING]: [RefundStatus.COMPLETED, RefundStatus.FAILED],
  [RefundStatus.COMPLETED]: [],
  [RefundStatus.FAILED]: [RefundStatus.PROCESSING, RefundStatus.CANCELLED],
  [RefundStatus.CANCELLED]: [],
};

/**
 * Asserts that a refund can transition from currentStatus to toStatus.
 * Throws ConflictException if the transition is invalid.
 */
export function assertRefundTransition(currentStatus: RefundStatus, toStatus: RefundStatus) {
  const allowed = VALID_REFUND_TRANSITIONS[currentStatus];
  
  if (!allowed || !allowed.includes(toStatus)) {
    throw new ConflictException({
      code: 'REFUND_INVALID_STATE_TRANSITION',
      message: `Cannot transition refund from ${currentStatus} to ${toStatus}`,
      currentStatus,
      toStatus,
    });
  }
}

/**
 * Validates which role can perform which transition.
 */
export function assertRefundRolePermission(
  role: 'BUYER' | 'SELLER' | 'SYSTEM' | 'ADMIN',
  toStatus: RefundStatus,
  currentStatus: RefundStatus
) {
  // 1. Buyer can only Cancel (if REQUESTED/ESCALATED) or Escalate (if REJECTED)
  if (role === 'BUYER') {
    if (toStatus === RefundStatus.CANCELLED) {
      if (currentStatus !== RefundStatus.REQUESTED && currentStatus !== RefundStatus.ESCALATED) {
        throw new ConflictException('Buyer can only cancel refunds in REQUESTED or ESCALATED state');
      }
    } else if (toStatus === RefundStatus.ESCALATED) {
      if (currentStatus !== RefundStatus.REJECTED) {
        throw new ConflictException('Buyer can only escalate rejected refunds');
      }
    } else {
      throw new ConflictException(`Buyer not allowed to set refund status to ${toStatus}`);
    }
  }

  // 2. Seller can only Approve or Reject (if REQUESTED)
  if (role === 'SELLER') {
    if (toStatus !== RefundStatus.APPROVED && toStatus !== RefundStatus.REJECTED) {
      throw new ConflictException(`Seller not allowed to set refund status to ${toStatus}`);
    }
    if (currentStatus !== RefundStatus.REQUESTED) {
      throw new ConflictException('Seller can only approve or reject refunds in REQUESTED state');
    }
  }

  // 3. Admin/System can do any valid transition
}
