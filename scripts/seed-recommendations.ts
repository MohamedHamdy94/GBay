import { PrismaClient, InteractionType, ListingStatus } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding recommendations data...');

  // 1. Ensure we have a buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      name: 'Test Buyer',
      status: 'ACTIVE',
    },
  });
  console.log(`Buyer: ${buyer.id}`);

  // 2. Get some active listings
  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    take: 10,
  });

  if (listings.length < 3) {
    console.error('Not enough active listings found. Run seed-products.ts first.');
    return;
  }

  // 3. Create interactions for the buyer
  console.log('Creating interactions...');
  for (let i = 0; i < 5; i++) {
    const listing = listings[i % listings.length];
    await prisma.userInteraction.create({
      data: {
        userId: buyer.id,
        listingId: listing.id,
        interaction: InteractionType.VIEW,
      },
    });
  }

  // 4. Create some orders to make items "trending"
  console.log('Creating orders for trending items...');
  const seller = await prisma.sellerProfile.findFirst({ where: { status: 'APPROVED' } });
  if (seller) {
    for (let i = 0; i < 3; i++) {
        const listing = listings[i % listings.length];
        await prisma.order.create({
            data: {
                userId: buyer.id,
                sellerId: seller.id,
                totalAmountCents: listing.buyNowPriceCents || 1000,
                status: 'CONFIRMED',
                shippingAddress: { city: 'Berlin', street: 'Test Str', zip: '12345' },
                items: {
                    create: {
                        listingId: listing.id,
                        productTitleSnapshot: 'Test Product',
                        quantity: 1,
                        priceCentsPerUnit: listing.buyNowPriceCents || 1000,
                    }
                }
            }
        });
    }
  }

  console.log('Seeding recommendations data completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
