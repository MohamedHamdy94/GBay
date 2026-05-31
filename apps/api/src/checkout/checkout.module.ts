import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutProcessor } from './checkout.processor';
import { PrismaCheckoutRepository } from './prisma-checkout.repository';
import { CHECKOUT_REPOSITORY } from './checkout.types';
import { CartModule } from '../cart/cart.module';
import { CommerceModule } from '../commerce/commerce.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database.module';

import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    /*
    BullModule.registerQueue({
      name: 'checkout-timeout',
    }),
    */
    CartModule,
    CommerceModule,
    AuthModule,
    DatabaseModule,
    OrderModule,
  ],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    CheckoutProcessor,
    {
      provide: CHECKOUT_REPOSITORY,
      useClass: PrismaCheckoutRepository,
    },
  ],
  exports: [CheckoutService],
})
export class CheckoutModule {}
