import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Cart & Checkout Test Data ---');

  // 1. Create Users
  const user1 = await prisma.user.upsert({
    where: { email: 'buyer1@example.com' },
    update: {},
    create: {
      email: 'buyer1@example.com',
      name: 'Buyer One',
      passwordHash: 'hashed',
      status: 'ACTIVE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'buyer2@example.com' },
    update: {},
    create: {
      email: 'buyer2@example.com',
      name: 'Buyer Two',
      passwordHash: 'hashed',
      status: 'ACTIVE',
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller-checkout@example.com' },
    update: {},
    create: {
      email: 'seller-checkout@example.com',
      name: 'Seller Checkout',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      sellerProfile: {
        create: {
          displayName: 'Checkout Shop',
          businessType: 'INDIVIDUAL',
          status: 'APPROVED',
        },
      },
    },
    include: { sellerProfile: true },
  });

  const sellerProfileId = sellerUser.sellerProfile!.id;

  // 2. Category
  const category = await prisma.category.upsert({
    where: { key: 'checkout-test-cat' },
    update: {},
    create: {
      key: 'checkout-test-cat',
      translations: {
        create: { locale: 'en', name: 'Checkout Category', slug: 'checkout-cat' },
      },
    },
  });

  // 3. Product with Limited Stock (1 item for race condition test)
  console.log('Creating limited stock product...');
  const productLimit = await prisma.product.create({
    data: {
      sellerId: sellerProfileId,
      status: 'ACTIVE',
      categoryId: category.id,
      condition: 'NEW',
      translations: {
        create: { locale: 'en', title: 'Last Item', slug: `last-item-${Date.now()}`, description: 'Only one left!' },
      },
      listings: {
        create: {
          sellerId: sellerProfileId,
          status: 'ACTIVE',
          type: 'BUY_NOW',
          buyNowPriceCents: 10000,
          quantityTotal: 1,
          quantityAvailable: 1,
        },
      },
    },
    include: { listings: true },
  });

  // 4. Product with normal stock
  console.log('Creating normal stock product...');
  const productNormal = await prisma.product.create({
    data: {
      sellerId: sellerProfileId,
      status: 'ACTIVE',
      categoryId: category.id,
      condition: 'NEW',
      translations: {
        create: { locale: 'en', title: 'Regular Item', slug: `reg-item-${Date.now()}`, description: 'Plenty of these.' },
      },
      listings: {
        create: {
          sellerId: sellerProfileId,
          status: 'ACTIVE',
          type: 'BUY_NOW',
          buyNowPriceCents: 2500,
          quantityTotal: 10,
          quantityAvailable: 10,
        },
      },
    },
    include: { listings: true },
  });

  console.log('Seed Complete!');
  console.log('Buyer 1 ID:', user1.id);
  console.log('Buyer 2 ID:', user2.id);
  console.log('Limited Listing ID:', productLimit.listings[0].id);
  console.log('Normal Listing ID:', productNormal.listings[0].id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
