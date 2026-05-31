import { PrismaClient, Currency, AuctionStatus, ListingStatus } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding auctions...');

  const seller = await prisma.sellerProfile.findFirst({
    where: { status: 'APPROVED' },
  });

  if (!seller) {
    console.log('No approved seller found. Please run previous seeds first.');
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { status: ListingStatus.ACTIVE },
    include: { product: true },
  });

  if (!listing) {
    console.log('No active listing found. Please run seed-products.ts first.');
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const auctions = [
    {
      listingId: listing.id,
      sellerId: seller.id,
      currency: Currency.EUR,
      startPriceCents: 10000, // 100 EUR
      minBidIncrementCents: 500, // 5 EUR
      startTime: now,
      endTime: tomorrow,
      status: AuctionStatus.ACTIVE,
      antiSnipingSeconds: 120,
    },
  ];

  for (const a of auctions) {
    // Delete existing bids to reset history
    await prisma.bid.deleteMany({ where: { auctionId: { in: (await prisma.auction.findMany({ where: { listingId: a.listingId }, select: { id: true } })).map(ax => ax.id) } } });

    await prisma.auction.upsert({
      where: { listingId: a.listingId },
      update: {
        ...a,
        currentHighestBidCents: null,
        version: 0,
      },
      create: a,
    });
  }

  console.log('Auctions seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
