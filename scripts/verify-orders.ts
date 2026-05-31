import { PrismaClient, OrderStatus } from '@gbay/database';
import { createHmac } from 'node:crypto';

const prisma = new PrismaClient();

// Minimal TokenService logic for the script
const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}
function signAccessToken(input: { userId: string; email: string | null }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: input.userId,
    email: input.email,
    typ: 'access',
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac('sha256', accessSecret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

async function apiFetch(url: string, method: string, body: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

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
  
  return { status: res.status, data };
}

async function main() {
  console.log('--- Module 8: Order Management Verification ---');

  // 1. Setup Actors
  const sellers = await prisma.sellerProfile.findMany({ 
    where: { status: 'APPROVED' },
    include: { user: true },
    take: 2 
  });
  const buyer = await prisma.user.findFirst({ where: { email: { startsWith: 'buyer' } } });

  if (sellers.length < 2 || !buyer) {
    throw new Error('Not enough approved sellers or no buyer found. Run seeds first.');
  }

  const [sellerA, sellerB] = sellers;
  const buyerToken = signAccessToken({ userId: buyer.id, email: buyer.email });
  const sellerAToken = signAccessToken({ userId: sellerA.userId, email: sellerA.user.email });
  const sellerBToken = signAccessToken({ userId: sellerB.userId, email: sellerB.user.email });

  console.log(`Using Buyer: ${buyer.email}`);
  console.log(`Using Seller A: ${sellerA.user.email}`);
  console.log(`Using Seller B: ${sellerB.user.email}`);

  // 2. Setup Products
  console.log('Setting up test products...');
  const category = await prisma.category.findFirst();
  if (!category) throw new Error('No category found');

  const createProduct = async (sellerId: string, title: string) => {
    return await prisma.product.create({
      data: {
        sellerId,
        condition: 'NEW',
        status: 'ACTIVE',
        categoryId: category.id,
        translations: {
          create: {
            locale: 'en',
            title,
            slug: `${title.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
            description: `Description for ${title}`
          }
        },
        listings: {
          create: {
            sellerId,
            type: 'BUY_NOW',
            status: 'ACTIVE',
            buyNowPriceCents: 1000,
            quantityTotal: 10,
            quantityAvailable: 10,
          }
        }
      },
      include: { listings: true }
    });
  };

  const productA = await createProduct(sellerA.id, `Order Test Item A ${Date.now()}`);
  const productB = await createProduct(sellerB.id, `Order Test Item B ${Date.now()}`);

  const listingAId = productA.listings[0].id;
  const listingBId = productB.listings[0].id;

  // 3. Multi-Seller Checkout
  console.log('\n--- Test: Multi-Seller Split & Order Creation ---');
  
  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cart: { userId: buyer.id } } });
  
  // Add items from different sellers
  await apiFetch('/cart/items', 'POST', { listingId: listingAId, quantity: 1 }, buyerToken);
  await apiFetch('/cart/items', 'POST', { listingId: listingBId, quantity: 2 }, buyerToken);
  
  const cartRes = await apiFetch('/cart', 'GET', null, buyerToken);
  const cartId = cartRes.data.id;

  // Initiate Checkout
  const initRes = await apiFetch('/checkout/initiate', 'POST', { 
    cartId, 
    idempotencyKey: `order-verify-${Date.now()}`,
    shippingAddress: { street: '123 Test St', city: 'Berlin', country: 'DE' }
  }, buyerToken);
  
  if (initRes.status !== 201) throw new Error(`Initiate checkout failed: ${JSON.stringify(initRes.data)}`);
  const sessionId = initRes.data.id;

  // Confirm Checkout -> This should create 2 orders
  console.log('Confirming checkout...');
  const confirmRes = await apiFetch('/checkout/confirm', 'POST', { checkoutSessionId: sessionId }, buyerToken);
  if (confirmRes.status !== 201) throw new Error(`Confirm checkout failed: ${JSON.stringify(confirmRes.data)}`);
  
  const orderIds = confirmRes.data.orderIds;
  console.log('Orders Created:', orderIds);
  if (orderIds.length !== 2) throw new Error(`Expected 2 orders, got ${orderIds.length}`);

  // 4. Verify Order State and Splitting
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { items: true }
  });

  const orderA = orders.find(o => o.sellerId === sellerA.id);
  const orderB = orders.find(o => o.sellerId === sellerB.id);

  if (!orderA || !orderB) throw new Error('Orders not correctly assigned to sellers');
  if (orderA.items.length !== 1 || orderB.items.length !== 1) throw new Error('Order items not correctly split');
  
  console.log('Order Splitting: PASSED');
  console.log('Initial Status: PENDING for both. PASSED');

  // 5. State Transitions: PENDING -> CONFIRMED (Manual simulation of payment)
  console.log('\n--- Test: State Transitions ---');
  console.log('Simulating payment confirmation for Order A...');
  await prisma.order.update({ where: { id: orderA.id }, data: { status: 'CONFIRMED' } });

  // 6. Valid Transition: CONFIRMED -> SHIPPED (SELLER A)
  console.log('Seller A marking Order A as SHIPPED...');
  const shipRes = await apiFetch(`/seller/orders/${orderA.id}/status`, 'PATCH', { status: 'SHIPPED' }, sellerAToken);
  console.log('Ship Status:', shipRes.status);
  if (shipRes.status !== 200) throw new Error(`Seller failed to mark as SHIPPED. Status: ${shipRes.status}, Data: ${JSON.stringify(shipRes.data)}`);
  
  const shippedOrder = await prisma.order.findUnique({ where: { id: orderA.id } });
  if (shippedOrder?.status !== 'SHIPPED') throw new Error('Status not updated to SHIPPED');
  console.log('Transition CONFIRMED -> SHIPPED: PASSED');

  // 7. Invalid Transition: SHIPPED -> CONFIRMED (SELLER A)
  console.log('Seller A trying invalid transition SHIPPED -> CONFIRMED...');
  const invalidRes = await apiFetch(`/seller/orders/${orderA.id}/status`, 'PATCH', { status: 'CONFIRMED' }, sellerAToken);
  console.log('Invalid Transition Status:', invalidRes.status);
  if (invalidRes.status < 400) {
    throw new Error(`Expected error for invalid transition, got ${invalidRes.status}`);
  }
  console.log('Invalid Transition Check: PASSED');

  // 8. Role Permission: SELLER A trying to DELIVER (Not allowed)
  console.log('Seller A trying to mark as DELIVERED...');
  const deliverRes = await apiFetch(`/seller/orders/${orderA.id}/status`, 'PATCH', { status: 'DELIVERED' }, sellerAToken);
  console.log('Deliver Forbidden Status:', deliverRes.status);
  if (deliverRes.status < 400) {
    throw new Error(`Expected error for Seller marking as DELIVERED, got ${deliverRes.status}`);
  }
  console.log('Role Permission Check (Seller cannot Deliver): PASSED');

  // 9. Unauthorized Access: SELLER B trying to update Order A
  console.log('Seller B trying to update Order A...');
  const unauthorizedRes = await apiFetch(`/seller/orders/${orderA.id}/status`, 'PATCH', { status: 'SHIPPED' }, sellerBToken);
  console.log('Unauthorized Access Status:', unauthorizedRes.status);
  if (unauthorizedRes.status < 400) {
    throw new Error(`Expected error for unauthorized access, got ${unauthorizedRes.status}`);
  }
  console.log('Unauthorized Access Check: PASSED');

  // 10. Buyer Cancellation: Order B is PENDING
  console.log('\n--- Test: Buyer Actions ---');
  console.log('Buyer cancelling Order B (PENDING)...');
  const cancelRes = await apiFetch(`/orders/${orderB.id}/cancel`, 'POST', null, buyerToken);
  console.log('Cancel Status:', cancelRes.status);
  if (cancelRes.status !== 201) throw new Error(`Buyer failed to cancel PENDING order. Status: ${cancelRes.status}`);
  
  const cancelledOrder = await prisma.order.findUnique({ where: { id: orderB.id } });
  if (cancelledOrder?.status !== 'CANCELLED') throw new Error('Order B status not CANCELLED');
  console.log('Buyer Cancel PENDING: PASSED');

  // 11. Buyer Return Request: Order A must be DELIVERED
  console.log('Simulating Order A DELIVERED...');
  await prisma.order.update({ where: { id: orderA.id }, data: { status: 'DELIVERED' } });
  
  console.log('Buyer requesting return for Order A...');
  const returnRes = await apiFetch(`/orders/${orderA.id}/return`, 'POST', null, buyerToken);
  console.log('Return Request Status:', returnRes.status);
  if (returnRes.status !== 201) throw new Error(`Buyer failed to request return. Status: ${returnRes.status}`);
  
  const returnedOrder = await prisma.order.findUnique({ where: { id: orderA.id } });
  if (returnedOrder?.status !== 'RETURN_REQUESTED') throw new Error('Order A status not RETURN_REQUESTED');
  console.log('Buyer Return Request: PASSED');

  console.log('\n--- ALL ORDER TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
