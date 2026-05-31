import { Module, forwardRef, Global } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MESSAGING_REPOSITORY } from './messaging.types';
import { PrismaMessagingRepository } from './prisma-messaging.repository';
import { OrderModule } from '../order/order.module';
import { DisputeModule } from '../dispute/dispute.module';
import { RefundModule } from '../refund/refund.module';
import { SellerModule } from '../seller/seller.module';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => OrderModule),
    forwardRef(() => DisputeModule),
    RefundModule,
    SellerModule,
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
    {
      provide: MESSAGING_REPOSITORY,
      useClass: PrismaMessagingRepository,
    },
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
