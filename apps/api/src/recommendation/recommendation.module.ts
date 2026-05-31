import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';
import { SellerModule } from '../seller/seller.module';
import { RECOMMENDATION_REPOSITORY } from './recommendation.types';
import { PrismaRecommendationRepository } from './prisma-recommendation.repository';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationListeners } from './recommendation.listeners';
import { RecommendationProcessor } from './recommendation.processor';

@Module({
  imports: [DatabaseModule, AuthModule, SellerModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationListeners,
    RecommendationProcessor,
    {
      provide: RECOMMENDATION_REPOSITORY,
      useClass: PrismaRecommendationRepository,
    },
  ],
  exports: [RecommendationService, RECOMMENDATION_REPOSITORY],
})
export class RecommendationModule {}
