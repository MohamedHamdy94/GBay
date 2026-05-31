import { BadRequestException } from '@nestjs/common';
import { SellerStatus } from './seller.types';

const allowedTransitions: Record<SellerStatus, SellerStatus[]> = {
  NOT_STARTED: ['SUBMITTED'],
  SUBMITTED: ['IN_REVIEW', 'NEEDS_MORE_INFO', 'APPROVED', 'REJECTED'],
  IN_REVIEW: ['NEEDS_MORE_INFO', 'APPROVED', 'REJECTED'],
  NEEDS_MORE_INFO: ['SUBMITTED', 'REJECTED'],
  APPROVED: ['SUSPENDED'],
  REJECTED: ['SUBMITTED'],
  SUSPENDED: ['IN_REVIEW'],
};

export function assertSellerTransition(from: SellerStatus, to: SellerStatus): void {
  if (!allowedTransitions[from]?.includes(to)) {
    throw new BadRequestException({
      code: 'SELLER_INVALID_STATE_TRANSITION',
      from,
      to,
    });
  }
}
