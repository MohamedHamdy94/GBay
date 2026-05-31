import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { 
  IAnalyticsRepository, 
  CreateAnalyticsEventDto, 
  DailyMetrics, 
  DashboardStats, 
  ChartDataPoint, 
  TopProduct, 
  TopSeller, 
  EventFilter,
  AnalyticsEvent
} from './analytics.types';

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async createEvent(data: CreateAnalyticsEventDto): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        sellerId: data.sellerId,
        data: data.data || {},
      },
    });
  }

  async getDailyMetrics(date: Date): Promise<DailyMetrics | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const metrics = await this.prisma.dailyMetrics.findUnique({
      where: { date: startOfDay },
    });

    if (!metrics) return null;

    return {
      date: metrics.date,
      totalRevenue: metrics.totalRevenue,
      totalOrders: metrics.totalOrders,
      newUsers: metrics.newUsers,
      newSellers: metrics.newSellers,
      activeAuctions: metrics.activeAuctions,
      refundedAmount: metrics.refundedAmount,
    };
  }

  async upsertDailyMetrics(data: DailyMetrics): Promise<void> {
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);

    await this.prisma.dailyMetrics.upsert({
      where: { date: startOfDay },
      update: {
        totalRevenue: data.totalRevenue,
        totalOrders: data.totalOrders,
        newUsers: data.newUsers,
        newSellers: data.newSellers,
        activeAuctions: data.activeAuctions,
        refundedAmount: data.refundedAmount,
      },
      create: {
        date: startOfDay,
        totalRevenue: data.totalRevenue,
        totalOrders: data.totalOrders,
        newUsers: data.newUsers,
        newSellers: data.newSellers,
        activeAuctions: data.activeAuctions,
        refundedAmount: data.refundedAmount,
      },
    });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [revenue, orders, newUsers, activeAuctions, openDisputes] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfDay },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmountCents: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.auction.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      this.prisma.dispute.count({
        where: {
          status: 'OPEN',
        },
      }),
    ]);

    return {
      todayRevenue: revenue._sum.totalAmountCents || 0,
      todayOrders: orders,
      todayNewUsers: newUsers,
      activeAuctions,
      openDisputes,
    };
  }

  async getRevenueChart(period: 'daily' | 'weekly' | 'monthly'): Promise<ChartDataPoint[]> {
    const now = new Date();
    let startDate: Date;

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30); // Last 30 days
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90); // Last 90 days
    } else {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1); // Last year
    }

    const metrics = await this.prisma.dailyMetrics.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return metrics.map(m => ({
      label: m.date.toISOString().split('T')[0],
      value: m.totalRevenue / 100, // Convert to major unit for charts
    }));
  }

  async getTopProducts(limit: number): Promise<TopProduct[]> {
    // This is a simplified version. Ideally we aggregate OrderItems.
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['listingId', 'productTitleSnapshot'],
      where: {
        order: {
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      },
      _count: { id: true },
      _sum: { priceCentsPerUnit: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return topItems.map(item => ({
      productId: item.listingId || 'unknown',
      title: item.productTitleSnapshot,
      salesCount: item._count.id,
      revenue: item._sum.priceCentsPerUnit || 0,
    }));
  }

  async getTopSellers(limit: number): Promise<TopSeller[]> {
    const topSellers = await this.prisma.order.groupBy({
      by: ['sellerId'],
      where: {
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      _count: { id: true },
      _sum: { totalAmountCents: true },
      orderBy: { _sum: { totalAmountCents: 'desc' } },
      take: limit,
    });

    // Fetch display names
    const sellerIds = topSellers.map(s => s.sellerId);
    const profiles = await this.prisma.sellerProfile.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, displayName: true },
    });

    const profileMap = new Map(profiles.map(p => [p.id, p.displayName]));

    return topSellers.map(s => ({
      sellerId: s.sellerId,
      displayName: profileMap.get(s.sellerId) || 'Unknown Seller',
      orderCount: s._count.id,
      totalRevenue: s._sum.totalAmountCents || 0,
    }));
  }

  async getEvents(filter: EventFilter): Promise<{ events: AnalyticsEvent[]; total: number }> {
    const where: any = {};
    if (filter.type) where.eventType = filter.type;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return { events, total };
  }

  async aggregateMetricsForDate(date: Date): Promise<DailyMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [revenue, orders, users, sellers, auctions, refunds] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmountCents: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.sellerProfile.count({
        where: {
          approvedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.auction.count({
        where: {
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay },
          status: 'ACTIVE',
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          completedAt: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED',
        },
        _sum: { amountCents: true },
      }),
    ]);

    return {
      date: startOfDay,
      totalRevenue: revenue._sum.totalAmountCents || 0,
      totalOrders: orders,
      newUsers: users,
      newSellers: sellers,
      activeAuctions: auctions,
      refundedAmount: refunds._sum.amountCents || 0,
    };
  }
}
