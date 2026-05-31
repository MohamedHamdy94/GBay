import { Controller, Get, Patch, Param, Query, UseGuards, Request, Inject } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GetNotificationsDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';

@Controller('notifications')
@UseGuards(BearerAuthGuard)
export class NotificationController {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  async getMyNotifications(@Query() dto: GetNotificationsDto, @Request() req: any) {
    return this.notificationService.getMyNotifications(req.user.id, {
      isRead: dto.isRead,
      limit: dto.limit,
      offset: dto.offset,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return { count: await this.notificationService.getUnreadCount(req.user.id) };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
