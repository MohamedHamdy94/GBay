import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth/auth.module';
import { SellerModule } from './seller/seller.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuctionModule } from './auction/auction.module';
import { CommerceModule } from './commerce/commerce.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrderModule } from './order/order.module';
import { EscrowModule } from './escrow/escrow.module';
import { ShippingModule } from './shipping/shipping.module';
import { RefundModule } from './refund/refund.module';
import { DisputeModule } from './dispute/dispute.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { ReviewModule } from './review/review.module';
import { AdminModule } from './admin/admin.module';
import { FraudModule } from './fraud/fraud.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SecurityModule } from './security/security.module';
import { ObservabilityModule } from './observability/observability.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggingThrottlerGuard } from './security/logging-throttler.guard';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryFilter } from './observability/sentry/sentry.filter';
import { LoggerInterceptor } from './observability/logging/logger.interceptor';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 100,
    }, {
      name: 'medium',
      ttl: 60000,
      limit: 30,
    }, {
      name: 'auth',
      ttl: 60000,
      limit: 5,
    }]),
    DatabaseModule,
    ObservabilityModule,
    ShippingModule,
    EscrowModule,
    RefundModule,
    DisputeModule,
    MessagingModule,
    NotificationModule,
    SearchModule,
    RecommendationModule,
    ReviewModule,
    AdminModule,
    FraudModule,
    AnalyticsModule,
    SecurityModule,
    AuthModule,
    SellerModule,
    CatalogModule,
    AuctionModule,
    CommerceModule,
    CartModule,
    CheckoutModule,
    OrderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LoggingThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule {}
