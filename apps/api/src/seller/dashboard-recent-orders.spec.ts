import assert from 'node:assert/strict';
import { InMemorySellerRepository } from './in-memory-seller.repository';
import { SellerCurrencyDto } from './dto';
import { SellerService } from './seller.service';

async function run() {
  const repo = new InMemorySellerRepository();
  const service = new SellerService(repo);
  
  const submitted = await service.submit('user_1', {
    displayName: 'Best Seller',
    businessName: 'Best Seller GmbH',
    businessType: 'company',
    countryCode: 'de',
    payoutCurrency: SellerCurrencyDto.EUR,
  });

  const mockOrders = [
    { id: 'order_1', status: 'CONFIRMED', amount: '99.00 EUR', date: new Date().toISOString() },
    { id: 'order_2', status: 'PENDING', amount: '45.00 EUR', date: new Date().toISOString() },
  ];

  repo.setRecentOrders(submitted.id, mockOrders);
  
  await service.refreshDashboardMetrics(submitted.id);
  
  const dashboard = await service.getDashboard('user_1');
  assert.equal(dashboard.sellerId, submitted.id);
  assert.equal(dashboard.recentOrders.length, 2);
  assert.equal(dashboard.recentOrders[0].id, 'order_1');
  assert.equal(dashboard.recentOrders[1].id, 'order_2');

  console.log('dashboard recent orders test passed');
}

void run().catch(err => {
  console.error(err);
  process.exit(1);
});
