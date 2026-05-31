import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepository, NotificationView, CreateNotificationInput } from './notification.types';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationView> {
    return this.repository.create(input);
  }

  async getMyNotifications(userId: string, filters?: { isRead?: boolean; limit?: number; offset?: number }): Promise<NotificationView[]> {
    return this.repository.findByUser(userId, filters);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationView> {
    const notification = await this.repository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Unauthorized');

    return this.repository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.repository.markAllAsRead(userId);
  }

  async cleanupOldNotifications(days = 30): Promise<number> {
    return this.repository.deleteOlderThan(days);
  }
}
