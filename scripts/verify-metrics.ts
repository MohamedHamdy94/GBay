import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  const seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    console.log('No seller found.');
    return;
  }

  const metrics = await prisma.sellerDashboardMetrics.findUnique({
    where: { sellerId: seller.id }
  });

  console.log('Metrics for seller', seller.id, ':', JSON.stringify(metrics, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
