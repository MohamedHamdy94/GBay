import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  const seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    console.log('No seller found. Please create one first.');
    return;
  }

  await prisma.sellerDashboardMetrics.upsert({
    where: { sellerId: seller.id },
    update: {
      totalListings: 15,
      activeAuctions: 5,
      soldItemsThisMonth: 8,
      pendingPayouts: 1250.50,
      totalEarnings: 4500.00,
      recentOrders: [
        { id: 'ORD-1', status: 'COMPLETED', amount: 150.00, date: new Date().toISOString() },
        { id: 'ORD-2', status: 'SHIPPED', amount: 200.00, date: new Date().toISOString() }
      ],
      salesLast7Days: [
        { date: '2026-05-21', count: 1, amount: 100 },
        { date: '2026-05-22', count: 2, amount: 250 },
        { date: '2026-05-23', count: 0, amount: 0 },
        { date: '2026-05-24', count: 3, amount: 400 },
        { date: '2026-05-25', count: 1, amount: 150 },
        { date: '2026-05-26', count: 2, amount: 300 },
        { date: '2026-05-27', count: 1, amount: 50 }
      ],
      lowStockItems: [
        { id: 'PROD-1', title: 'Vintage Watch', stock: 2 },
        { id: 'PROD-2', title: 'Leather Bag', stock: 1 }
      ]
    },
    create: {
      sellerId: seller.id,
      totalListings: 15,
      activeAuctions: 5,
      soldItemsThisMonth: 8,
      pendingPayouts: 1250.50,
      totalEarnings: 4500.00,
      recentOrders: [
        { id: 'ORD-1', status: 'COMPLETED', amount: 150.00, date: new Date().toISOString() },
        { id: 'ORD-2', status: 'SHIPPED', amount: 200.00, date: new Date().toISOString() }
      ],
      salesLast7Days: [
        { date: '2026-05-21', count: 1, amount: 100 },
        { date: '2026-05-22', count: 2, amount: 250 },
        { date: '2026-05-23', count: 0, amount: 0 },
        { date: '2026-05-24', count: 3, amount: 400 },
        { date: '2026-05-25', count: 1, amount: 150 },
        { date: '2026-05-26', count: 2, amount: 300 },
        { date: '2026-05-27', count: 1, amount: 50 }
      ],
      lowStockItems: [
        { id: 'PROD-1', title: 'Vintage Watch', stock: 2 },
        { id: 'PROD-2', title: 'Leather Bag', stock: 1 }
      ]
    }
  });

  console.log('Dashboard metrics seeded for seller:', seller.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
