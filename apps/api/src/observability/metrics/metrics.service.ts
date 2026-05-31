import { Injectable } from '@nestjs/common';
import { Counter, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('auction_bids_total')
    public readonly auctionBidsCounter: Counter<string>,
    @InjectMetric('orders_created_total')
    public readonly ordersCreatedCounter: Counter<string>,
    @InjectMetric('users_registered_total')
    public readonly usersRegisteredCounter: Counter<string>,
    @InjectMetric('active_websocket_connections')
    public readonly activeWebsocketConnectionsGauge: Gauge<string>,
  ) {}

  incrementBids() {
    this.auctionBidsCounter.inc();
  }

  incrementOrders() {
    this.ordersCreatedCounter.inc();
  }

  incrementUsers() {
    this.usersRegisteredCounter.inc();
  }

  updateWebsocketConnections(count: number) {
    this.activeWebsocketConnectionsGauge.set(count);
  }
}
