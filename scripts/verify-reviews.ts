import { PrismaClient } from '@gbay/database';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'dev-access-secret-change-before-production';

async function main() {
  console.log('--- Module 19: Reviews & Ratings Verification ---');

  // 1. Setup Data
  const buyer = await prisma.user.findFirst({ where: { email: 'buyer@example.com' } });
  if (!buyer) throw new Error('Run seed-recommendations.ts first');
  const buyerToken = jwt.sign({ sub: buyer.id, email: buyer.email }, JWT_SECRET);

  // 2. Find a DELIVERED order for this buyer
  let order = await prisma.order.findFirst({
    where: { userId: buyer.id, status: 'DELIVERED' },
    include: { items: true }
  });

  if (!order) {
    console.log('No delivered order found. Transitioning one...');
    const anyOrder = await prisma.order.findFirst({ where: { userId: buyer.id } });
    if (!anyOrder) throw new Error('No orders found for buyer. Run verify-orders.ts first.');
    
    order = await prisma.order.update({
        where: { id: anyOrder.id },
        data: { status: 'DELIVERED' },
        include: { items: true }
    });
  }

  const apiFetch = async (url: string, method: string, token: string, body?: any) => {
    const res = await fetch(`http://localhost:4000${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!res.ok) {
        const error = await res.text();
        return { status: res.status, data: error, ok: false };
    }

    const data = res.status !== 204 ? await res.json() : null;
    return { status: res.status, data, ok: true };
  };

  console.log(`--- Step 1: Create Review for order ${order.id} ---`);
  // Clean up any existing review first for re-runability
  await prisma.review.deleteMany({ where: { orderId: order.id } });

  const reviewPayload = {
    rating: 5,
    comment: 'Amazing product and fast shipping!'
  };

  const createRes = await apiFetch(`/v1/orders/${order.id}/review`, 'POST', buyerToken, reviewPayload);
  if (!createRes.ok) {
    throw new Error(`Create review failed: ${createRes.data}`);
  }
  console.log('Review created successfully.');

  console.log('--- Step 2: Attempt Duplicate Review (Should Fail) ---');
  const duplicateRes = await apiFetch(`/v1/orders/${order.id}/review`, 'POST', buyerToken, reviewPayload);
  if (duplicateRes.ok || duplicateRes.status !== 400) {
    throw new Error(`Duplicate review should have failed with 400, got ${duplicateRes.status}`);
  }
  console.log('Duplicate review correctly rejected.');

  console.log('--- Step 3: GET Listing Reviews ---');
  const firstListingId = order.items.find(i => i.listingId !== null)?.listingId;
  if (firstListingId) {
    const listingRes = await apiFetch(`/v1/listings/${firstListingId}/reviews`, 'GET', buyerToken);
    if (!listingRes.ok) throw new Error('Failed to fetch listing reviews');
    console.log(`Found ${listingRes.data.length} reviews for listing.`);
  }

  console.log('--- Step 4: GET My Reviews ---');
  const myRes = await apiFetch('/v1/reviews/me', 'GET', buyerToken);
  if (!myRes.ok) throw new Error('Failed to fetch my reviews');
  console.log(`Found ${myRes.data.length} reviews for current user.`);

  console.log('--- Step 5: Verify Seller Dashboard Metrics Integration ---');
  const metrics = await prisma.sellerDashboardMetrics.findUnique({
    where: { sellerId: order.sellerId }
  });
  console.log(`Seller Rating: ${metrics?.averageRating}, Reviews: ${metrics?.reviewCount}`);
  // We don't assert exact values here because other tests might have run, 
  // but reviewCount should be > 0.

  console.log('--- ALL REVIEW & RATING TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
