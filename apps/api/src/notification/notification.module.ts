import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaNotificationRepository } from './prisma-notification.repository';
import { NOTIFICATION_REPOSITORY } from './notification.types';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';
import { NotificationListeners } from './notification.listeners';

@Module({
  imports: [DatabaseModule, AuthModule, SellerModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationListeners,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
