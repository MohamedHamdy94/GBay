import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import { SellerRepository, SellerProfileView, SubmitSellerInput, TransitionSellerInput, SellerDashboardMetricsView, RecentOrderMetric, SalesHistoryMetric, LowStockItemMetric } from './seller.types';

@Injectable()
export class PrismaSellerRepository implements SellerRepository {
  private readonly prisma = new PrismaClient();

  async findByUserId(userId: string): Promise<SellerProfileView | null> {
    return this.prisma.sellerProfile.findUnique({ where: { userId } }) as Promise<SellerProfileView | null>;
  }

  async findById(id: string): Promise<SellerProfileView | null> {
    return this.prisma.sellerProfile.findUnique({ where: { id } }) as Promise<SellerProfileView | null>;
  }

  async createSubmitted(input: SubmitSellerInput): Promise<SellerProfileView> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.create({
        data: {
          userId: input.userId,
          displayName: input.displayName,
          businessName: input.businessName,
          businessType: input.businessType,
          countryCode: input.countryCode.toUpperCase(),
          payoutCurrency: input.payoutCurrency,
          status: 'SUBMITTED',
        },
      });
      await tx.sellerVerificationEvent.create({
        data: {
          sellerProfileId: profile.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          actorUserId: input.userId,
          reason: 'Seller onboarding submitted',
        },
      });
      return profile as SellerProfileView;
    });
  }

  async transition(input: TransitionSellerInput): Promise<SellerProfileView> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.sellerProfile.findUnique({ where: { id: input.sellerProfileId } });
      if (!current) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });
      const patch = {
        status: input.toStatus,
        rejectionReason: input.toStatus === 'REJECTED' || input.toStatus === 'NEEDS_MORE_INFO' ? input.reason ?? null : null,
        reviewedAt: new Date(),
        approvedAt: input.toStatus === 'APPROVED' ? new Date() : current.approvedAt,
        suspendedAt: input.toStatus === 'SUSPENDED' ? new Date() : current.suspendedAt,
        version: { increment: 1 },
      };
      const updated = await tx.sellerProfile.update({ where: { id: input.sellerProfileId }, data: patch });
      await tx.sellerVerificationEvent.create({
        data: {
          sellerProfileId: input.sellerProfileId,
          fromStatus: current.status,
          toStatus: input.toStatus,
          actorUserId: input.actorUserId,
          reason: input.reason,
        },
      });
      return updated as SellerProfileView;
    });
  }

  async getDashboardMetrics(sellerId: string): Promise<SellerDashboardMetricsView | null> {
    const metrics = await this.prisma.sellerDashboardMetrics.findUnique({
      where: { sellerId },
    });
    if (!metrics) return null;
    return {
      ...metrics,
      recentOrders: (metrics.recentOrders ?? []) as unknown as RecentOrderMetric[],
      salesLast7Days: (metrics.salesLast7Days ?? []) as unknown as SalesHistoryMetric[],
      lowStockItems: (metrics.lowStockItems ?? []) as unknown as LowStockItemMetric[],
      pendingPayouts: metrics.pendingPayouts.toString(),
      totalEarnings: metrics.totalEarnings.toString(),
    } as SellerDashboardMetricsView;
  }

  async upsertDashboardMetrics(sellerId: string, data: Partial<SellerDashboardMetricsView>): Promise<SellerDashboardMetricsView> {
    const { sellerId: _s, updatedAt: _u, ...updateData } = data;
    const upserted = await this.prisma.sellerDashboardMetrics.upsert({
      where: { sellerId },
      create: {
        sellerId,
        totalListings: data.totalListings ?? 0,
        activeAuctions: data.activeAuctions ?? 0,
        soldItemsThisMonth: data.soldItemsThisMonth ?? 0,
        pendingPayouts: data.pendingPayouts ?? '0',
        totalEarnings: data.totalEarnings ?? '0',
        recentOrders: (data.recentOrders ?? []) as any,
        salesLast7Days: (data.salesLast7Days ?? []) as any,
        lowStockItems: (data.lowStockItems ?? []) as any,
      },
      update: updateData as any,
    });
    return {
      ...upserted,
      recentOrders: (upserted.recentOrders ?? []) as unknown as RecentOrderMetric[],
      salesLast7Days: (upserted.salesLast7Days ?? []) as unknown as SalesHistoryMetric[],
      lowStockItems: (upserted.lowStockItems ?? []) as unknown as LowStockItemMetric[],
      pendingPayouts: upserted.pendingPayouts.toString(),
      totalEarnings: upserted.totalEarnings.toString(),
    } as SellerDashboardMetricsView;
  }

  async countProducts(sellerId: string): Promise<number> {
    return this.prisma.product.count({
      where: { sellerId },
    });
  }

  async getRecentOrders(sellerId: string, limit: number): Promise<RecentOrderMetric[]> {
    const orders = await this.prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        currency: true,
        createdAt: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      amount: `${(o.totalAmountCents / 100).toFixed(2)} ${o.currency}`,
      date: o.createdAt.toISOString(),
    }));
  }
}

