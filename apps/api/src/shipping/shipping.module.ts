import { Module, Global } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { SHIPPING_REPOSITORY } from './shipping.types';
import { PrismaShippingRepository } from './prisma-shipping.repository';
import { DatabaseModule } from '../database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    ShippingService,
    {
      provide: SHIPPING_REPOSITORY,
      useClass: PrismaShippingRepository,
    },
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
