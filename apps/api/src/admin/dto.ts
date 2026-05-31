export class PaginationQueryDto {
  skip?: number;
  take?: number;
}

export class UserSearchQueryDto extends PaginationQueryDto {
  status?: string;
  q?: string;
}

export class SellerSearchQueryDto extends PaginationQueryDto {
  status?: string;
}

export class ListingSearchQueryDto extends PaginationQueryDto {
  status?: string;
  q?: string;
}

export class AuctionSearchQueryDto extends PaginationQueryDto {
  status?: string;
}

export class OrderSearchQueryDto extends PaginationQueryDto {
  status?: string;
}

export class DisputeSearchQueryDto extends PaginationQueryDto {
  status?: string;
}

export class RefundSearchQueryDto extends PaginationQueryDto {
  status?: string;
}

export class AuditLogSearchQueryDto extends PaginationQueryDto {
  action?: string;
  adminId?: string;
}

export class UpdateUserStatusDto {
  status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  reason!: string;
}

export class UpdateSellerStatusDto {
  status!: 'IN_REVIEW' | 'NEEDS_MORE_INFO' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  reason!: string;
}

export class UpdateListingStatusDto {
  status!: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'ENDED' | 'REJECTED' | 'DELETED';
  reason!: string;
}

export class ResolveDisputeDto {
  resolution!: string;
  status!: 'RESOLVED_BUYER' | 'RESOLVED_SELLER';
  reason!: string;
}

export class UpdateFeatureFlagDto {
  enabled!: boolean;
}
