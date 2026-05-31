import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaClient } from '@gbay/database';
import { Injectable, Logger } from '@nestjs/common';

@Processor('checkout-timeout')
@Injectable()
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);
  private readonly prisma = new PrismaClient();

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'expire-session') {
      const { sessionId } = job.data;
      this.logger.log(`Checking expiration for session ${sessionId}`);

      await this.prisma.$transaction(async (tx) => {
        const session = await tx.checkoutSession.findUnique({
          where: { id: sessionId },
          include: { reservations: true }
        });

        if (!session || session.status !== 'PENDING') {
          return;
        }

        this.logger.log(`Expiring session ${sessionId} and releasing reservations`);

        // 1. Mark session as EXPIRED
        await tx.checkoutSession.update({
          where: { id: sessionId },
          data: { status: 'EXPIRED' }
        });

        // 2. Release Reservations
        for (const res of session.reservations) {
          if (res.status === 'ACTIVE') {
            await tx.inventoryReservation.update({
              where: { id: res.id },
              data: {
                status: 'RELEASED',
                releasedAt: new Date()
              }
            });

            // 3. Restore stock
            await tx.listing.update({
              where: { id: res.listingId },
              data: {
                quantityAvailable: { increment: res.quantity },
                status: 'ACTIVE' // Ensure it's active again
              }
            });
          }
        }
      });
    }
  }
}
