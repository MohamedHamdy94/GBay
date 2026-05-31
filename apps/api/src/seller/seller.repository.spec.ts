import assert from 'node:assert/strict';
import { InMemorySellerRepository } from './in-memory-seller.repository';
import { SellerDashboardMetricsView } from './seller.types';

async function testInMemoryRepository() {
  const repo = new InMemorySellerRepository();
  const sellerId = 'seller_1';

  // Test getDashboardMetrics returns null if not found
  const notFound = await repo.getDashboardMetrics(sellerId);
  assert.equal(notFound, null);

  // Test upsertDashboardMetrics (create)
  const initialData: Partial<SellerDashboardMetricsView> = {
    totalListings: 10,
    activeAuctions: 5,
    pendingPayouts: '100.50',
  };
  const created = await repo.upsertDashboardMetrics(sellerId, initialData);
  assert.equal(created.sellerId, sellerId);
  assert.equal(created.totalListings, 10);
  assert.equal(created.activeAuctions, 5);
  assert.equal(created.pendingPayouts, '100.50');
  assert.equal(created.totalEarnings, '0'); // Default value
  assert.ok(created.updatedAt instanceof Date);

  // Test upsertDashboardMetrics (update)
  const updateData: Partial<SellerDashboardMetricsView> = {
    totalListings: 12,
    totalEarnings: '500.00',
  };
  const updated = await repo.upsertDashboardMetrics(sellerId, updateData);
  assert.equal(updated.totalListings, 12);
  assert.equal(updated.activeAuctions, 5); // Kept from previous
  assert.equal(updated.totalEarnings, '500.00');
  
  const fetched = await repo.getDashboardMetrics(sellerId);
  assert.deepEqual(fetched, updated);

  console.log('InMemorySellerRepository metrics tests passed');
}

testInMemoryRepository().catch(err => {
  console.error(err);
  process.exit(1);
});
