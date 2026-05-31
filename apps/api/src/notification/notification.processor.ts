import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from './notification.service';

/*
@Processor('notification-cleanup')
*/
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'cleanup') {
      const deletedCount = await this.notificationService.cleanupOldNotifications(30);
      return { deletedCount };
    }
  }
}
