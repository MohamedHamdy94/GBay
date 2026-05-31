import assert from 'node:assert/strict';
import { InMemorySellerRepository } from './in-memory-seller.repository';
import { SellerCurrencyDto } from './dto';
import { SellerService } from './seller.service';

async function run() {
  const service = new SellerService(new InMemorySellerRepository());
  const submitted = await service.submit('user_1', {
    displayName: 'Best Seller',
    businessName: 'Best Seller GmbH',
    businessType: 'company',
    countryCode: 'de',
    payoutCurrency: SellerCurrencyDto.EUR,
  });
  assert.equal(submitted.status, 'SUBMITTED');
  assert.equal(submitted.countryCode, 'DE');

  const inReview = await service.review(submitted.id, 'IN_REVIEW', 'admin_1', 'KYC review started');
  assert.equal(inReview.status, 'IN_REVIEW');

  const approved = await service.review(submitted.id, 'APPROVED', 'admin_1', 'KYC passed');
  assert.equal(approved.status, 'APPROVED');
  assert.ok(approved.approvedAt);

  const dashboard = await service.getDashboard('user_1');
  assert.equal(dashboard.sellerId, submitted.id);
  assert.equal(dashboard.totalListings, 0);

  // Test dynamic metric update
  const repo = (service as any).repository as InMemorySellerRepository;
  repo.setProductCount(submitted.id, 5);
  await service.refreshDashboardMetrics(submitted.id);
  
  const updatedDashboard = await service.getDashboard('user_1');
  assert.equal(updatedDashboard.totalListings, 5);

  await assert.rejects(() => service.review(submitted.id, 'REJECTED', 'admin_1', 'Too late'));
  console.log('seller service test passed');
}

void run();
