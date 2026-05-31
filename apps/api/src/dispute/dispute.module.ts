import { Module, forwardRef, Global } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { DISPUTE_REPOSITORY } from './dispute.types';
import { PrismaDisputeRepository } from './prisma-dispute.repository';
import { RefundModule } from '../refund/refund.module';
import { EscrowModule } from '../escrow/escrow.module';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';
import { MessagingModule } from '../messaging/messaging.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SellerModule,
    forwardRef(() => RefundModule),
    forwardRef(() => EscrowModule),
    forwardRef(() => MessagingModule),
  ],
  controllers: [DisputeController],
  providers: [
    DisputeService,
    {
      provide: DISPUTE_REPOSITORY,
      useClass: PrismaDisputeRepository,
    },
  ],
  exports: [DisputeService],
})
export class DisputeModule {}
