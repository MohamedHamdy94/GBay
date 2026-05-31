import { ConflictException } from '@nestjs/common';
import { DisputeStatus } from '@gbay/database';

/**
 * Valid transitions for a Dispute.
 */
const VALID_DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  [DisputeStatus.OPEN]: [DisputeStatus.UNDER_REVIEW, DisputeStatus.CLOSED],
  [DisputeStatus.UNDER_REVIEW]: [DisputeStatus.RESOLVED_BUYER, DisputeStatus.RESOLVED_SELLER, DisputeStatus.CLOSED],
  [DisputeStatus.RESOLVED_BUYER]: [],
  [DisputeStatus.RESOLVED_SELLER]: [],
  [DisputeStatus.CLOSED]: [],
};

/**
 * Asserts that a dispute can transition from currentStatus to toStatus.
 * Throws ConflictException if the transition is invalid.
 */
export function assertDisputeTransition(currentStatus: DisputeStatus, toStatus: DisputeStatus) {
  const allowed = VALID_DISPUTE_TRANSITIONS[currentStatus];
  
  if (!allowed || !allowed.includes(toStatus)) {
    throw new ConflictException({
      code: 'DISPUTE_INVALID_STATE_TRANSITION',
      message: `Cannot transition dispute from ${currentStatus} to ${toStatus}`,
      currentStatus,
      toStatus,
    });
  }
}

/**
 * Validates which role can perform which transition.
 */
export function assertDisputeRolePermission(
  role: 'BUYER' | 'SELLER' | 'SYSTEM' | 'ADMIN',
  toStatus: DisputeStatus,
  currentStatus: DisputeStatus
) {
  // Only ADMIN or SYSTEM can transition dispute status
  if (role !== 'ADMIN' && role !== 'SYSTEM') {
    throw new ConflictException(`Only Admin can set dispute status to ${toStatus}`);
  }
}
