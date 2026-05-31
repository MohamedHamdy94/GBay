import { Module, forwardRef, Global } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { REFUND_REPOSITORY } from './refund.types';
import { PrismaRefundRepository } from './prisma-refund.repository';
import { OrderModule } from '../order/order.module';
import { EscrowModule } from '../escrow/escrow.module';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SellerModule,
    forwardRef(() => OrderModule),
    forwardRef(() => EscrowModule),
  ],
  controllers: [RefundController],
  providers: [
    RefundService,
    {
      provide: REFUND_REPOSITORY,
      useClass: PrismaRefundRepository,
    },
  ],
  exports: [RefundService],
})
export class RefundModule {}
