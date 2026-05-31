import { NotificationType } from '@gbay/database';

export interface NotificationView {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationView>;
  findById(id: string): Promise<NotificationView | null>;
  findByUser(userId: string, filters?: { isRead?: boolean; limit?: number; offset?: number }): Promise<NotificationView[]>;
  countUnread(userId: string): Promise<number>;
  markAsRead(id: string): Promise<NotificationView>;
  markAllAsRead(userId: string): Promise<void>;
  deleteOlderThan(days: number): Promise<number>;
}
