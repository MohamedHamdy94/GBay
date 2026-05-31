import assert from 'node:assert/strict';
import { AuctionService } from './auction.service';
import { AuctionRepository } from './auction.types';

async function run() {
  const repository = {
    create: async (input: any) => ({ id: 'a1', ...input, status: 'SCHEDULED', version: 0 }),
    findById: async (id: string) => id === 'a1' ? { id: 'a1', sellerId: 's1', status: 'ACTIVE', version: 0 } : null,
    getBidHistory: async () => [],
  } as any;
  const sellerService = {
    getMine: async (userId: string) => ({ id: userId === 'u1' ? 's1' : 'other' })
  } as any;
  const eventEmitter = { emit: () => {} } as any;
  const service = new AuctionService(repository, eventEmitter, sellerService);

  const input = { listingId: '1', sellerId: 's1', startPriceCents: 1000, startTime: new Date(), endTime: new Date() };
  const created = await service.create(input as any);
  assert.equal(created.id, 'a1');

  try {
    await service.findById('none');
    assert.fail('Should have thrown');
  } catch (e: any) {
    assert.equal(e.response.code, 'AUCTION_NOT_FOUND');
  }

  console.log('auction service test passed');
}

void run();
