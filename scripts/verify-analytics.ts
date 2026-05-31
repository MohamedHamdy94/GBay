import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function getAdminToken() {
  const adminUser = await prisma.user.findFirst({
    where: { 
      roles: { 
        some: { 
          role: { key: 'ADMIN' } 
        } 
      } 
    },
    include: { roles: { include: { role: true } } }
  });

  if (!adminUser) {
    const anyUser = await prisma.user.findFirst();
    if (!anyUser) throw new Error('No users found in database');
    return tokenService.signAccessToken({
      userId: anyUser.id,
      email: anyUser.email || 'test@example.com',
      roles: ['ADMIN']
    });
  }

  return tokenService.signAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    roles: adminUser.roles.map(r => r.role.key)
  });
}

async function seedTestData() {
  console.log('Seeding test analytics data...');
  
  // Create some events for today
  await prisma.analyticsEvent.createMany({
    data: [
      { eventType: 'USER_REGISTERED', entityType: 'USER', entityId: 'test-user-1' },
      { eventType: 'ORDER_CREATED', entityType: 'ORDER', entityId: 'test-order-1', data: { amountCents: 5000 } },
      { eventType: 'ORDER_CREATED', entityType: 'ORDER', entityId: 'test-order-2', data: { amountCents: 15000 } },
      { eventType: 'AUCTION_BID', entityType: 'AUCTION', entityId: 'test-auction-1', data: { amountCents: 2000 } },
    ]
  });

  // Create some orders for aggregation
  const seller = await prisma.sellerProfile.findFirst();
  const user = await prisma.user.findFirst();
  
  if (seller && user) {
    await prisma.order.create({
      data: {
        userId: user.id,
        sellerId: seller.id,
        totalAmountCents: 10000,
        currency: 'EUR',
        status: 'CONFIRMED',
        shippingAddress: { city: 'Berlin' },
        items: {
          create: {
            productTitleSnapshot: 'Test Product',
            quantity: 1,
            priceCentsPerUnit: 10000
          }
        }
      }
    });
  }

  console.log('Test data seeded.');
}

async function verify() {
  const token = await getAdminToken();
  const baseUrl = 'http://localhost:4000/v1/admin/analytics';

  await seedTestData();

  console.log('\n--- Phase 1: Dashboard Stats ---');
  const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashboard = await dashboardRes.json();
  console.log('Dashboard Stats:', dashboard);
  if (dashboardRes.status !== 200) throw new Error('Failed to fetch dashboard stats');

  console.log('\n--- Phase 2: Revenue Chart ---');
  const revenueRes = await fetch(`${baseUrl}/revenue?period=daily`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const revenue = await revenueRes.json();
  console.log(`Received ${revenue.length} revenue data points`);
  if (revenueRes.status !== 200) throw new Error('Failed to fetch revenue chart');

  console.log('\n--- Phase 3: Top Products ---');
  const productsRes = await fetch(`${baseUrl}/top-products?limit=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const products = await productsRes.json();
  console.log(`Top Products: ${products.length} found`);
  if (productsRes.status !== 200) throw new Error('Failed to fetch top products');

  console.log('\n--- Phase 4: Event Log ---');
  const eventsRes = await fetch(`${baseUrl}/events?limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const eventsData = await eventsRes.json();
  console.log(`Event Log: ${eventsData.events.length} events, total ${eventsData.total}`);
  if (eventsRes.status !== 200) throw new Error('Failed to fetch events');

  console.log('\n✅ Analytics Module verified successfully!');
}

verify()
  .catch(err => {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
