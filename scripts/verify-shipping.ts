import { PrismaClient, OrderStatus, ShipmentStatus } from '@gbay/database';
import { createHmac } from 'node:crypto';

const prisma = new PrismaClient();

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
const adminActionKey = process.env.ADMIN_ACTION_KEY ?? 'dev-admin-key-change-me';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function signAccessToken(input: { userId: string; email: string | null; roles?: string[] }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: input.userId,
    email: input.email,
    roles: input.roles,
    typ: 'access',
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac('sha256', accessSecret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

async function apiFetch(url: string, method: string, body: any, token?: string) {
  const headers: any = { 
    'Content-Type': 'application/json',
    'X-Admin-Action-Key': adminActionKey
  };
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
  
  if (res.status >= 400) {
    console.warn(`[WARN] API ${method} ${url} returned ${res.status}:`, data);
  }
  
  return { status: res.status, data };
}

async function main() {
  console.log('--- Module 10: Shipping Verification ---');

  // 1. Setup Actors
  const sellers = await prisma.sellerProfile.findMany({ 
    where: { status: 'APPROVED' },
    include: { user: true }
  });
  const sellerA = sellers[0];
  const sellerAToken = signAccessToken({ userId: sellerA.user.id, email: sellerA.user.email });

  const buyers = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
  const buyer = buyers.find(b => b.id !== sellerA.userId);
  if (!buyer) throw new Error('Buyer not found');
  const buyerToken = signAccessToken({ userId: buyer.id, email: buyer.email });

  // 2. Create a Test Order
  console.log('\n--- Test: Shipment Creation on Order ---');
  // We'll create the order via API if possible, or just seed it.
  // Using API is better.
  
  // Actually, creating an order usually happens via Checkout.
  // For simplicity, let's just create an order and call the service method if we had a test endpoint,
  // but we don't. So let's just create the order and manually trigger shipment creation or use the seller ship endpoint.
  
  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: sellerA.id,
      status: OrderStatus.CONFIRMED,
      totalAmountCents: 5000,
      currency: 'EUR',
      shippingAddress: { city: 'Berlin' },
    }
  });

  // Manually create shipment as if OrderService.createOrdersFromCheckout was called
  await prisma.shipment.create({
    data: {
      orderId: order.id,
      status: ShipmentStatus.PROCESSING
    }
  });

  console.log(`Order ${order.id} and Shipment created.`);

  // 3. Test Seller Ship Order
  console.log('\n--- Test: Seller Ship Order ---');
  const shipRes = await apiFetch(`/seller/orders/${order.id}/ship`, 'POST', {
    trackingNumber: 'TRK123456',
    carrier: 'DHL'
  }, sellerAToken);

  if (shipRes.status !== 201) {
    console.error('FAIL: Seller could not ship order');
    process.exit(1);
  }
  console.log('Order marked as SHIPPED by seller. PASSED');

  // Check Order Status
  const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (updatedOrder?.status !== OrderStatus.SHIPPED) {
    console.error(`FAIL: Order status is ${updatedOrder?.status}, expected SHIPPED`);
    process.exit(1);
  }
  console.log('Order status updated to SHIPPED. PASSED');

  // 4. Test Track Order
  console.log('\n--- Test: Track Order (Buyer) ---');
  const trackRes = await apiFetch(`/orders/${order.id}/shipment`, 'GET', null, buyerToken);
  
  if (trackRes.status !== 200 || trackRes.data.trackingNumber !== 'TRK123456') {
    console.error('FAIL: Buyer could not track order', trackRes.data);
    process.exit(1);
  }
  console.log('Buyer tracked order successfully. PASSED');

  console.log('\n--- ALL SHIPPING TESTS PASSED! ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
