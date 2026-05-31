import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommerceService } from './commerce.service';
import { CommerceController } from './commerce.controller';
import { PrismaCommerceRepository } from './prisma-commerce.repository';
import { COMMERCE_REPOSITORY } from './commerce.types';

@Module({
  imports: [AuthModule],
  controllers: [CommerceController],
  providers: [
    CommerceService,
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
  ],
  exports: [CommerceService],
})
export class CommerceModule {}
