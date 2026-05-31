import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdminRepository, AdminDashboardMetrics, AdminAuditLog, FeatureFlag } from './admin.types';

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [
      totalUsers,
      newUsersLast24h,
      totalSellers,
      pendingSellers,
      activeListings,
      activeAuctions,
      openDisputes,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.sellerProfile.count(),
      this.prisma.sellerProfile.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalAmountCents: true } })
    ]);

    return {
      totalUsers,
      newUsersLast24h,
      totalSellers,
      pendingSellers,
      activeListings,
      activeAuctions,
      openDisputes,
      totalOrders,
      totalRevenueCents: totalRevenue._sum.totalAmountCents || 0,
    };
  }

  async listUsers(params: { skip: number; take: number; status?: any; q?: string }) {
    const where = {
      ...(params.status && { status: params.status }),
      ...(params.q && {
        OR: [
          { email: { contains: params.q, mode: 'insensitive' } },
          { name: { contains: params.q, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async listSellers(params: { skip: number; take: number; status?: any }) {
    const where = {
      ...(params.status && { status: params.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { submittedAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.sellerProfile.count({ where }),
    ]);
    return { items, total };
  }

  async listListings(params: { skip: number; take: number; status?: any; q?: string }) {
    const where = {
      ...(params.status && { status: params.status }),
      ...(params.q && {
        product: {
          translations: {
            some: {
              title: { contains: params.q, mode: 'insensitive' },
            },
          },
        },
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              translations: true,
              seller: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);
    return { items, total };
  }

  async listAuctions(params: { skip: number; take: number; status?: any }) {
    const where = {
      ...(params.status && { status: params.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { endTime: 'asc' },
        include: {
          listing: {
            include: {
              product: {
                include: { translations: true },
              },
            },
          },
          seller: true,
        },
      }),
      this.prisma.auction.count({ where }),
    ]);
    return { items, total };
  }

  async listOrders(params: { skip: number; take: number; status?: any }) {
    const where = {
      ...(params.status && { status: params.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          seller: true,
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  async listDisputes(params: { skip: number; take: number; status?: any }) {
    const where = {
      ...(params.status && { status: params.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          refund: {
            include: {
              order: true,
              buyer: true,
              seller: true,
            },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return { items, total };
  }

  async listRefunds(params: { skip: number; take: number; status?: any }) {
    const where = {
      ...(params.status && { status: params.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          buyer: true,
          seller: true,
        },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return { items, total };
  }

  async listAuditLogs(params: { skip: number; take: number; action?: string; adminId?: string }) {
    const where = {
      ...(params.action && { action: params.action }),
      ...(params.adminId && { adminId: params.adminId }),
    };
    const [items, total] = await Promise.all([
      this.prisma.adminAction.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { admin: true },
      }),
      this.prisma.adminAction.count({ where }),
    ]);
    return { items: items as any[], total };
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
    return flags as FeatureFlag[];
  }

  async updateFeatureFlag(name: string, enabled: boolean): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.upsert({
      where: { name },
      update: { enabled },
      create: { name, enabled },
    });
    return flag as FeatureFlag;
  }

  async createAuditLog(data: Omit<AdminAuditLog, 'id' | 'createdAt'>): Promise<AdminAuditLog> {
    const log = await this.prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details,
      },
    });
    return log as any as AdminAuditLog;
  }

  // Helper methods for status updates
  async updateUserStatus(id: string, status: any) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateSellerStatus(id: string, status: any, reason?: string) {
    return this.prisma.sellerProfile.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? reason : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
    });
  }

  async updateListingStatus(id: string, status: any) {
    return this.prisma.listing.update({
      where: { id },
      data: { status },
    });
  }

  async cancelAuction(id: string) {
    return this.prisma.auction.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async resolveDispute(id: string, status: any, resolution: string) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedAt: new Date(),
      },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
  }

  async findSellerById(id: string) {
    return this.prisma.sellerProfile.findUnique({ where: { id }, include: { user: true } });
  }

  async findListingById(id: string) {
    return this.prisma.listing.findUnique({ 
      where: { id }, 
      include: { 
        product: { 
          include: { translations: true, seller: true } 
        } 
      } 
    });
  }

  async findAuctionById(id: string) {
    return this.prisma.auction.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            product: {
              include: { translations: true },
            },
          },
        },
        seller: true,
      },
    });
  }

  async findDisputeById(id: string) {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        refund: {
          include: {
            order: true,
            buyer: true,
            seller: true,
          },
        },
      },
    });
  }
}
