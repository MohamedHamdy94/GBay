import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function main() {
  console.log('--- Module 7: Cart & Checkout Verification ---');

  // 1. Setup
  const buyer1 = await prisma.user.findUnique({ where: { email: 'buyer1@example.com' } });
  const buyer2 = await prisma.user.findUnique({ where: { email: 'buyer2@example.com' } });
  
  if (!buyer1 || !buyer2) throw new Error('Buyers not found. Run seed-cart.ts first.');

  const lastListing = await prisma.listing.findFirst({
    where: { product: { translations: { some: { title: 'Last Item' } } } },
    orderBy: { createdAt: 'desc' }
  });

  const regListing = await prisma.listing.findFirst({
    where: { product: { translations: { some: { title: 'Regular Item' } } } },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastListing || !regListing) throw new Error('Listings not found.');

  console.log('Resetting stock for test items...');
  await prisma.listing.update({
    where: { id: lastListing.id },
    data: { quantityAvailable: 1, status: 'ACTIVE' }
  });
  await prisma.listing.update({
    where: { id: regListing.id },
    data: { quantityAvailable: 10, status: 'ACTIVE' }
  });

  const token1 = tokenService.signAccessToken({ userId: buyer1.id, email: buyer1.email! });
  const token2 = tokenService.signAccessToken({ userId: buyer2.id, email: buyer2.email! });

  console.log('Cleaning up carts...');
  await prisma.cartItem.deleteMany({
    where: { cart: { userId: { in: [buyer1.id, buyer2.id] } } }
  });
  await prisma.cartItem.deleteMany({
    where: { cart: { sessionToken: { not: null } } } // Clear guest carts too
  });

  const apiFetch = async (url: string, method: string, body: any, token?: string, cookie?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(`http://localhost:4000/v1${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    
    return { 
      status: res.status, 
      data, 
      cookies: res.headers.get('set-cookie') 
    };
  };

  // --- TEST 1: Guest Cart & Session Token ---
  console.log('\n--- Test 1: Guest Cart ---');
  const res1 = await apiFetch('/cart', 'GET', null);
  console.log('Guest Cart Status:', res1.status);
  const sessionCookie = res1.cookies;
  if (!sessionCookie) throw new Error('Cookie not set for guest');
  console.log('Session Cookie received');

  // --- TEST 2: Add Item as Guest ---
  console.log('\n--- Test 2: Add Item as Guest ---');
  const res2 = await apiFetch('/cart/items', 'POST', { listingId: regListing.id, quantity: 2 }, undefined, sessionCookie);
  console.log('Add Item Status:', res2.status);
  if (res2.status !== 201) throw new Error('Failed to add item as guest');

  // --- TEST 3: Auth Cart & Merging ---
  console.log('\n--- Test 3: Auth Cart & Merging ---');
  // First, get an empty auth cart
  const res3a = await apiFetch('/cart', 'GET', null, token1);
  console.log('Initial Auth Cart Status:', res3a.status, 'Items:', res3a.data.items.length);

  // Now, call cart with both token AND guest cookie to trigger merge
  const res3b = await apiFetch('/cart', 'GET', null, token1, sessionCookie);
  console.log('Merged Auth Cart Items:', res3b.data.items.length);
  if (res3b.data.items.length === 0) throw new Error('Cart merging failed');

  const cartId = res3b.data.id;

  // --- TEST 4: Concurrency Race Condition ---
  console.log('\n--- Test 4: Concurrency Race Condition (Racing for last item) ---');
  
  // Setup: Each user adds the last item to their cart
  await apiFetch('/cart/items', 'POST', { listingId: lastListing.id, quantity: 1 }, token1);
  
  // User 2 needs their own cart
  const resCart2 = await apiFetch('/cart', 'GET', null, token2);
  const cartId2 = resCart2.data.id;
  await apiFetch('/cart/items', 'POST', { listingId: lastListing.id, quantity: 1 }, token2);

  console.log('Triggering parallel initiateCheckout...');
  const [race1, race2] = await Promise.all([
    apiFetch('/checkout/initiate', 'POST', { cartId, idempotencyKey: `race-1-${Date.now()}` }, token1),
    apiFetch('/checkout/initiate', 'POST', { cartId: cartId2, idempotencyKey: `race-2-${Date.now()}` }, token2)
  ]);

  console.log('Race Result 1:', race1.status, JSON.stringify(race1.data));
  console.log('Race Result 2:', race2.status, JSON.stringify(race2.data));

  const successCount = [race1.status, race2.status].filter(s => s === 201).length;
  const conflictCount = [race1.status, race2.status].filter(s => s === 409).length;

  if (successCount !== 1 || conflictCount !== 1) {
    throw new Error(`Race condition test failed. Success: ${successCount}, Conflicts: ${conflictCount}`);
  }
  console.log('Race condition handled correctly: One winner, one conflict.');

  const winnerSession = race1.status === 201 ? race1.data : race2.data;
  const winnerToken = race1.status === 201 ? token1 : token2;

  // --- TEST 5: Confirm Checkout ---
  console.log('\n--- Test 5: Confirm Checkout ---');
  const res5 = await apiFetch('/checkout/confirm', 'POST', { checkoutSessionId: winnerSession.id }, winnerToken);
  console.log('Confirm Status:', res5.status);
  if (res5.status !== 201) throw new Error('Confirmation failed');

  // Verify stock is now 0 and status is SOLD
  const finalListing = await prisma.listing.findUnique({ where: { id: lastListing.id } });
  console.log('Final Listing Stock:', finalListing?.quantityAvailable, 'Status:', finalListing?.status);
  if (finalListing?.quantityAvailable !== 0 || finalListing?.status !== 'SOLD') {
    throw new Error('Listing status/stock incorrect after confirmation');
  }

  // --- TEST 6: Simulated Timeout & Release ---
  console.log('\n--- Test 6: Simulated Timeout & Release ---');
  // 1. Clear cart first to avoid previous test leftovers
  await prisma.cartItem.deleteMany({ where: { cartId } });
  
  await apiFetch('/cart/items', 'POST', { listingId: regListing.id, quantity: 5 }, token1);
  const resInit = await apiFetch('/checkout/initiate', 'POST', { cartId, idempotencyKey: `timeout-test-${Date.now()}` }, token1);
  console.log('Initiate Timeout Test Status:', resInit.status);
  if (resInit.status !== 201) {
    console.error('Initiate failed:', JSON.stringify(resInit.data));
    throw new Error('Failed to initiate checkout for timeout test');
  }
  const sessionId = resInit.data.id;
  
  const midListing = await prisma.listing.findUnique({ where: { id: regListing.id } });
  console.log('Stock after reservation:', midListing?.quantityAvailable);
  const reservedQty = 5;

  // 2. Manually trigger expiration logic (instead of waiting for BullMQ worker)
  // We'll simulate what the processor does
  console.log('Simulating timeout release...');
  await prisma.$transaction(async (tx) => {
    const session = await tx.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { reservations: true }
    });

    if (session && session.status === 'PENDING') {
      await tx.checkoutSession.update({ where: { id: sessionId }, data: { status: 'EXPIRED' as any } });
      for (const res of session.reservations) {
        await tx.inventoryReservation.update({ where: { id: res.id }, data: { status: 'RELEASED' as any, releasedAt: new Date() } });
        await tx.listing.update({ where: { id: res.listingId }, data: { quantityAvailable: { increment: res.quantity }, status: 'ACTIVE' as any } });
      }
    }
  });

  const postReleaseListing = await prisma.listing.findUnique({ where: { id: regListing.id } });
  console.log('Stock after release:', postReleaseListing?.quantityAvailable);
  
  if (postReleaseListing?.quantityAvailable !== midListing!.quantityAvailable + reservedQty) {
    throw new Error('Stock release failed');
  }

  console.log('\n--- ALL TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
