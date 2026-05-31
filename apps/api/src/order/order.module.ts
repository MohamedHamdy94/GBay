import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaOrderRepository } from './prisma-order.repository';
import { ORDER_REPOSITORY } from './order.types';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';
import { DatabaseModule } from '../database.module';
import { EscrowModule } from '../escrow/escrow.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [
    EventEmitterModule,
    AuthModule, 
    SellerModule, 
    DatabaseModule, 
    EscrowModule, 
    ShippingModule
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [OrderService],
})
export class OrderModule {}
