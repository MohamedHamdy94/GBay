import assert from 'node:assert/strict';
import { CatalogService } from './catalog.service';
import { InMemoryCatalogRepository } from './in-memory-catalog.repository';

async function run() {
  const repository = new InMemoryCatalogRepository();
  const mockEventEmitter = {
    emit: () => {},
  } as any;
  const service = new CatalogService(repository, mockEventEmitter);

  console.log('Testing categories...');
  const cat1 = await service.createCategory({
    key: 'cat1',
    translations: [{ locale: 'en', name: 'Cat 1', slug: 'cat1' }],
  });
  const cat2 = await service.createCategory({
    key: 'cat2',
    parentId: cat1.id,
    translations: [{ locale: 'en', name: 'Cat 2', slug: 'cat2' }],
  });

  const tree = await service.listCategories(true);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, cat1.id);
  assert.equal(tree[0].children?.length, 1);
  assert.equal(tree[0].children?.[0].id, cat2.id);

  console.log('Testing products with listings...');
  const product = await service.createProduct({
    sellerId: 'seller_1',
    categoryId: cat2.id,
    condition: 'new',
    translations: [
      { locale: 'en', title: 'Product EN', slug: 'product-en', description: 'Desc EN' },
      { locale: 'de', title: 'Produkt DE', slug: 'produkt-de', description: 'Beschreibung DE' },
    ],
    listing: {
      buyNowPriceCents: 1000,
      quantityTotal: 10,
    },
  });

  assert.equal(product.translations.length, 2);
  assert.equal(product.listings?.[0].buyNowPriceCents, 1000);

  console.log('Testing product filtering...');
  const filtered = await service.listProducts({
    priceMin: 500,
    priceMax: 1500,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, product.id);

  const filteredNone = await service.listProducts({
    priceMin: 2000,
  });
  assert.equal(filteredNone.length, 0);

  const byCategory = await service.listProducts({
    categoryId: cat2.id,
  });
  assert.equal(byCategory.length, 1);

  console.log('catalog service test passed');
}

void run();
