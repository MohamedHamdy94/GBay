import { randomUUID } from 'node:crypto';
import { SellerProfileView, SellerRepository, SubmitSellerInput, TransitionSellerInput, SellerDashboardMetricsView, RecentOrderMetric } from './seller.types';

export class InMemorySellerRepository implements SellerRepository {
  private readonly profiles = new Map<string, SellerProfileView>();
  private readonly metrics = new Map<string, SellerDashboardMetricsView>();
  private readonly productCounts = new Map<string, number>();
  private readonly recentOrders = new Map<string, RecentOrderMetric[]>();

  async findByUserId(userId: string): Promise<SellerProfileView | null> {
    return [...this.profiles.values()].find((profile) => profile.userId === userId) ?? null;
  }

  async findById(id: string): Promise<SellerProfileView | null> {
    return this.profiles.get(id) ?? null;
  }

  async createSubmitted(input: SubmitSellerInput): Promise<SellerProfileView> {
    const profile: SellerProfileView = {
      id: randomUUID(),
      userId: input.userId,
      displayName: input.displayName,
      businessName: input.businessName ?? null,
      businessType: input.businessType,
      countryCode: input.countryCode.toUpperCase(),
      payoutCurrency: input.payoutCurrency,
      status: 'SUBMITTED',
      rejectionReason: null,
      submittedAt: new Date(),
      reviewedAt: null,
      approvedAt: null,
      suspendedAt: null,
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async transition(input: TransitionSellerInput): Promise<SellerProfileView> {
    const current = this.profiles.get(input.sellerProfileId);
    if (!current) throw new Error('SELLER_PROFILE_NOT_FOUND');
    const updated: SellerProfileView = {
      ...current,
      status: input.toStatus,
      rejectionReason: input.toStatus === 'REJECTED' || input.toStatus === 'NEEDS_MORE_INFO' ? input.reason ?? null : null,
      reviewedAt: new Date(),
      approvedAt: input.toStatus === 'APPROVED' ? new Date() : current.approvedAt,
      suspendedAt: input.toStatus === 'SUSPENDED' ? new Date() : current.suspendedAt,
    };
    this.profiles.set(updated.id, updated);
    return updated;
  }

  async getDashboardMetrics(sellerId: string): Promise<SellerDashboardMetricsView | null> {
    return this.metrics.get(sellerId) ?? null;
  }

  async upsertDashboardMetrics(sellerId: string, data: Partial<SellerDashboardMetricsView>): Promise<SellerDashboardMetricsView> {
    const existing = this.metrics.get(sellerId) || {
      sellerId,
      totalListings: 0,
      activeAuctions: 0,
      soldItemsThisMonth: 0,
      pendingPayouts: '0',
      totalEarnings: '0',
      recentOrders: [],
      salesLast7Days: [],
      lowStockItems: [],
      updatedAt: new Date(),
    };
    const updated: SellerDashboardMetricsView = { ...existing, ...data, updatedAt: new Date() };
    this.metrics.set(sellerId, updated);
    return updated;
  }

  async countProducts(sellerId: string): Promise<number> {
    return this.productCounts.get(sellerId) ?? 0;
  }

  async getRecentOrders(sellerId: string, limit: number): Promise<RecentOrderMetric[]> {
    return this.recentOrders.get(sellerId)?.slice(0, limit) ?? [];
  }

  // Helper for tests
  setProductCount(sellerId: string, count: number) {
    this.productCounts.set(sellerId, count);
  }

  setRecentOrders(sellerId: string, orders: RecentOrderMetric[]) {
    this.recentOrders.set(sellerId, orders);
  }
}
