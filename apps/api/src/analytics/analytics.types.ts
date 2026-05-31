export const ANALYTICS_REPOSITORY = 'ANALYTICS_REPOSITORY';

export interface IAnalyticsRepository {
  createEvent(data: CreateAnalyticsEventDto): Promise<void>;
  getDailyMetrics(date: Date): Promise<DailyMetrics | null>;
  upsertDailyMetrics(data: DailyMetrics): Promise<void>;
  getDashboardStats(): Promise<DashboardStats>;
  getRevenueChart(period: 'daily' | 'weekly' | 'monthly'): Promise<ChartDataPoint[]>;
  getTopProducts(limit: number): Promise<TopProduct[]>;
  getTopSellers(limit: number): Promise<TopSeller[]>;
  getEvents(filter: EventFilter): Promise<{ events: AnalyticsEvent[]; total: number }>;
  aggregateMetricsForDate(date: Date): Promise<DailyMetrics>;
}

export interface CreateAnalyticsEventDto {
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  sellerId?: string;
  data?: any;
}

export interface DailyMetrics {
  date: Date;
  totalRevenue: number;
  totalOrders: number;
  newUsers: number;
  newSellers: number;
  activeAuctions: number;
  refundedAmount: number;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayNewUsers: number;
  activeAuctions: number;
  openDisputes: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  salesCount: number;
  revenue: number;
}

export interface TopSeller {
  sellerId: string;
  displayName: string;
  orderCount: number;
  totalRevenue: number;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  sellerId: string | null;
  data: any;
  createdAt: Date;
}

export interface EventFilter {
  type?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
