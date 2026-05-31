import { PrismaClient, Locale, ListingStatus } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');

  const seller = await prisma.sellerProfile.findFirst({
    where: { status: 'APPROVED' },
  });

  if (!seller) {
    console.log('No approved seller found. Please approve a seller first.');
    return;
  }

  const smartphoneCat = await prisma.category.findUnique({
    where: { key: 'smartphones' },
  });

  const laptopCat = await prisma.category.findUnique({
    where: { key: 'laptops' },
  });

  if (!smartphoneCat || !laptopCat) {
    console.log('Categories not found. Please run seed-categories.ts first.');
    return;
  }

  const products = [
    {
      sku: 'iphone-15-pro',
      categoryId: smartphoneCat.id,
      brand: 'Apple',
      condition: 'new',
      translations: {
        create: [
          {
            locale: Locale.en,
            title: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            description: 'The latest iPhone with titanium design.',
          },
          {
            locale: Locale.de,
            title: 'iPhone 15 Pro',
            slug: 'iphone-15-pro-de',
            description: 'Das neueste iPhone mit Titan-Design.',
          },
        ],
      },
      listings: {
        create: {
          sellerId: seller.id,
          status: ListingStatus.ACTIVE,
          buyNowPriceCents: 99900,
          quantityTotal: 5,
          quantityAvailable: 5,
        },
      },
    },
    {
      sku: 'macbook-air-m2',
      categoryId: laptopCat.id,
      brand: 'Apple',
      condition: 'new',
      translations: {
        create: [
          {
            locale: Locale.en,
            title: 'MacBook Air M2',
            slug: 'macbook-air-m2',
            description: 'Supercharged by M2 chip.',
          },
          {
            locale: Locale.de,
            title: 'MacBook Air M2',
            slug: 'macbook-air-m2-de',
            description: 'Superstark durch den M2 Chip.',
          },
        ],
      },
      listings: {
        create: {
          sellerId: seller.id,
          status: ListingStatus.ACTIVE,
          buyNowPriceCents: 119900,
          quantityTotal: 3,
          quantityAvailable: 3,
        },
      },
    },
    {
      sku: 'pixel-8',
      categoryId: smartphoneCat.id,
      brand: 'Google',
      condition: 'new',
      translations: {
        create: [
          {
            locale: Locale.en,
            title: 'Google Pixel 8',
            slug: 'pixel-8',
            description: 'The helpful phone engineered by Google.',
          },
        ],
      },
      listings: {
        create: {
          sellerId: seller.id,
          status: ListingStatus.ACTIVE,
          buyNowPriceCents: 69900,
          quantityTotal: 10,
          quantityAvailable: 10,
        },
      },
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        sellerId: seller.id,
        ...p,
      },
    });
  }

  console.log('Products seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
