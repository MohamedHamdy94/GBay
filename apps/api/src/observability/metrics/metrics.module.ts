import { Module, Global } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { ProtectedMetricsController } from './metrics.controller';
import { AdminModule } from '../../admin/admin.module';
import { AuthModule } from '../../auth/auth.module';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      controller: ProtectedMetricsController,
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'auction_bids_total',
      help: 'Total number of bids placed in auctions',
    }),
    makeCounterProvider({
      name: 'orders_created_total',
      help: 'Total number of orders created',
    }),
    makeCounterProvider({
      name: 'users_registered_total',
      help: 'Total number of users registered',
    }),
    makeGaugeProvider({
      name: 'active_websocket_connections',
      help: 'Number of active WebSocket connections',
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
