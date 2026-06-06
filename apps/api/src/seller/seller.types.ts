export type SellerStatus = 'NOT_STARTED' | 'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_MORE_INFO' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type Currency = 'EUR' | 'USD';

export interface SellerProfileView {
  id: string;
  userId: string;
  displayName: string;
  businessName: string | null;
  businessType: string;
  countryCode: string;
  payoutCurrency: Currency;
  status: SellerStatus;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  suspendedAt: Date | null;
}

export interface RecentOrderMetric {
  id: string;
  status: string;
  amount: string;
  date: string;
}

export interface SalesHistoryMetric {
  date: string;
  count: number;
  amount: string;
}

export interface LowStockItemMetric {
  id: string;
  title: string;
  stock: number;
}

export interface SellerDashboardMetricsView {
  sellerId: string;
  totalListings: number;
  activeAuctions: number;
  soldItemsThisMonth: number;
  pendingPayouts: string; // Decimal as string for JSON
  totalEarnings: string;
  recentOrders: RecentOrderMetric[];
  salesLast7Days: SalesHistoryMetric[];
  lowStockItems: LowStockItemMetric[];
  updatedAt: Date;
}

export interface SubmitSellerInput {
  userId: string;
  displayName: string;
  businessName?: string;
  businessType: string;
  countryCode: string;
  payoutCurrency: Currency;
}

export interface TransitionSellerInput {
  sellerProfileId: string;
  toStatus: SellerStatus;
  actorUserId?: string;
  reason?: string;
}

export interface SellerRepository {
  findByUserId(userId: string): Promise<SellerProfileView | null>;
  findById(id: string): Promise<SellerProfileView | null>;
  createSubmitted(input: SubmitSellerInput): Promise<SellerProfileView>;
  transition(input: TransitionSellerInput): Promise<SellerProfileView>;
  getDashboardMetrics(sellerId: string): Promise<SellerDashboardMetricsView | null>;
  upsertDashboardMetrics(sellerId: string, data: Partial<SellerDashboardMetricsView>): Promise<SellerDashboardMetricsView>;
  countProducts(sellerId: string): Promise<number>;
  getRecentOrders(sellerId: string, limit: number): Promise<RecentOrderMetric[]>;
}
