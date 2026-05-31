import assert from 'node:assert/strict';
import { RecommendationService } from './recommendation.service';
import { RecommendationType, InteractionType } from './dto';

async function run() {
  const repositoryMock: any = {
    getTrendingProducts: (limit: number) => Promise.resolve([{ id: 'p1' }, { id: 'p2' }].slice(0, limit)),
    getSimilarProducts: (productId: string, limit: number) => Promise.resolve([{ id: 'p2' }]),
    getCachedRecommendations: (userId: string, type: RecommendationType, limit: number) => Promise.resolve([{ id: 'p1' }]),
    trackInteraction: (data: any) => {
      repositoryMock.lastInteraction = data;
      return Promise.resolve();
    },
  };

  const processorMock: any = {
    computeTrending: () => Promise.resolve(),
    computeSimilarities: () => Promise.resolve(),
    computePersonalized: () => Promise.resolve(),
  };

  const service = new RecommendationService(repositoryMock, processorMock);

  // Test getRecommendations - TRENDING
  const trending = await service.getRecommendations(RecommendationType.TRENDING, undefined, undefined, 1);
  assert.equal(trending.length, 1);
  assert.equal(trending[0].id, 'p1');

  // Test getRecommendations - SIMILAR_PRODUCTS
  const similar = await service.getRecommendations(RecommendationType.SIMILAR_PRODUCTS, undefined, 'p1', 10);
  assert.equal(similar.length, 1);
  assert.equal(similar[0].id, 'p2');

  // Test getRecommendations - SIMILAR_PRODUCTS (missing productId)
  const similarMissing = await service.getRecommendations(RecommendationType.SIMILAR_PRODUCTS, undefined, undefined, 10);
  assert.equal(similarMissing.length, 0);

  // Test getRecommendations - BASED_ON_HISTORY
  const history = await service.getRecommendations(RecommendationType.BASED_ON_HISTORY, 'u1', undefined, 10);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'p1');

  // Test trackView
  await service.trackView('u1', 'p1');
  assert.deepEqual(repositoryMock.lastInteraction, {
    userId: 'u1',
    listingId: 'p1',
    interaction: InteractionType.VIEW,
  });

  console.log('recommendation service test passed');
}

void run().catch(err => {
  console.error(err);
  process.exit(1);
});
