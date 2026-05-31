import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationRepository, NotificationView, CreateNotificationInput } from './notification.types';
import { NotificationType } from '@gbay/database';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<NotificationView> {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data || {},
      },
    });
  }

  async findById(id: string): Promise<NotificationView | null> {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUser(userId: string, filters?: { isRead?: boolean; limit?: number; offset?: number }): Promise<NotificationView[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: filters?.isRead,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string): Promise<NotificationView> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    return result.count;
  }
}
