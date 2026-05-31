import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Search Index Jobs ---');

  const listings = await prisma.listing.findMany({
    select: { id: true }
  });

  console.log(`Found ${listings.length} listings to index.`);

  for (const listing of listings) {
    await prisma.searchIndexJob.create({
      data: {
        entityType: 'LISTING',
        entityId: listing.id,
        operation: 'INDEX',
      }
    });
  }

  console.log('All indexing jobs queued.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
