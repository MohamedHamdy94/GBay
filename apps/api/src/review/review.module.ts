import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';
import { OrderModule } from '../order/order.module';
import { REVIEW_REPOSITORY } from './review.types';
import { PrismaReviewRepository } from './prisma-review.repository';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewListeners } from './review.listeners';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => SellerModule),
    forwardRef(() => OrderModule),
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewListeners,
    {
      provide: REVIEW_REPOSITORY,
      useClass: PrismaReviewRepository,
    },
  ],
  exports: [ReviewService, REVIEW_REPOSITORY],
})
export class ReviewModule {}
