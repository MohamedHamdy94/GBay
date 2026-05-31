import { PrismaClient, OrderStatus, EscrowStatus } from '@gbay/database';
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
  console.log('--- Module 9: Escrow Management Verification ---');

  // 1. Setup Actors
  const adminUser = await prisma.user.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } }
  });
  if (!adminUser) throw new Error('Admin user not found in DB. Run seed first.');
  const adminToken = signAccessToken({ userId: adminUser.id, email: adminUser.email, roles: ['admin'] });

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
  console.log('\n--- Test: Escrow Creation on Order Confirmation ---');
  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: sellerA.id,
      status: OrderStatus.PENDING,
      totalAmountCents: 5000,
      currency: 'EUR',
      shippingAddress: { city: 'Berlin' },
    }
  });

  console.log(`Order created: ${order.id}. Confirming order...`);
  // Confirm order as ADMIN (Simulating payment success / system confirmation)
  await apiFetch(`/seller/orders/${order.id}/status`, 'PATCH', { status: OrderStatus.CONFIRMED }, adminToken);

  // Check Escrow
  const escrow = await prisma.escrowHold.findUnique({ where: { orderId: order.id } });
  if (!escrow) {
    console.error('FAIL: Escrow hold not created');
    process.exit(1);
  }
  console.log(`Escrow created: ${escrow.id}, Status: ${escrow.status}. PASSED`);

  // 3. Test Escrow Release on Delivery
  console.log('\n--- Test: Escrow Release on Order Delivery ---');
  await apiFetch(`/seller/orders/${order.id}/status`, 'PATCH', { status: OrderStatus.SHIPPED }, sellerAToken);
  
  // Delivered usually updated by SYSTEM or ADMIN or Buyer confirming
  await apiFetch(`/seller/orders/${order.id}/status`, 'PATCH', { status: OrderStatus.DELIVERED }, adminToken);

  const releasedEscrow = await prisma.escrowHold.findUnique({ where: { id: escrow.id } });
  if (releasedEscrow?.status !== EscrowStatus.RELEASED_TO_SELLER) {
    console.error(`FAIL: Escrow status is ${releasedEscrow?.status}, expected RELEASED_TO_SELLER`);
    process.exit(1);
  }
  console.log('Escrow released to seller. PASSED');

  // 4. Test Escrow Refund on Cancellation
  console.log('\n--- Test: Escrow Refund on Order Cancellation ---');
  const order2 = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: sellerA.id,
      status: OrderStatus.CONFIRMED,
      totalAmountCents: 3000,
      currency: 'EUR',
      shippingAddress: { city: 'Munich' },
    }
  });
  // Manually create escrow if it wasn't triggered (though it should have been if we used the service)
  // But wait, creating via prisma directly won't trigger the service logic.
  // We should use the API to confirm if we want the full flow, or trigger it manually.
  
  // Let's use the API to confirm order2
  await prisma.order.update({ where: { id: order2.id }, data: { status: OrderStatus.PENDING } });
  await apiFetch(`/seller/orders/${order2.id}/status`, 'PATCH', { status: OrderStatus.CONFIRMED }, adminToken);

  const escrow2 = await prisma.escrowHold.findUnique({ where: { orderId: order2.id } });
  console.log(`Order 2 confirmed, Escrow 2: ${escrow2?.id}`);

  console.log('Buyer cancelling Order 2...');
  await apiFetch(`/orders/${order2.id}/cancel`, 'POST', {}, buyerToken);

  const refundedEscrow = await prisma.escrowHold.findUnique({ where: { id: escrow2?.id } });
  if (refundedEscrow?.status !== EscrowStatus.REFUNDED_TO_BUYER) {
    console.error(`FAIL: Escrow 2 status is ${refundedEscrow?.status}, expected REFUNDED_TO_BUYER`);
    process.exit(1);
  }
  console.log('Escrow refunded to buyer. PASSED');

  // 5. Test Admin Actions
  console.log('\n--- Test: Admin Escrow Actions (Dispute & Manual Release) ---');
  const order3 = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: sellerA.id,
      status: OrderStatus.PENDING,
      totalAmountCents: 10000,
      currency: 'EUR',
      shippingAddress: { city: 'Hamburg' },
    }
  });
  await apiFetch(`/seller/orders/${order3.id}/status`, 'PATCH', { status: OrderStatus.CONFIRMED }, adminToken);
  const escrow3 = await prisma.escrowHold.findUnique({ where: { orderId: order3.id } });

  console.log('Admin disputing Escrow 3...');
  await apiFetch(`/admin/escrow/${escrow3?.id}/dispute`, 'POST', { reason: 'Item not as described' }, adminToken);
  
  const disputedEscrow = await prisma.escrowHold.findUnique({ where: { id: escrow3?.id } });
  if (disputedEscrow?.status !== EscrowStatus.DISPUTED) {
    console.error(`FAIL: Escrow 3 status is ${disputedEscrow?.status}, expected DISPUTED`);
    process.exit(1);
  }
  console.log('Escrow disputed. PASSED');

  console.log('Admin manually releasing disputed Escrow 3...');
  await apiFetch(`/admin/escrow/${escrow3?.id}/release`, 'POST', { reason: 'Dispute resolved in favor of seller' }, adminToken);

  const finalEscrow3 = await prisma.escrowHold.findUnique({ where: { id: escrow3?.id } });
  if (finalEscrow3?.status !== EscrowStatus.RELEASED_TO_SELLER) {
    console.error(`FAIL: Escrow 3 status is ${finalEscrow3?.status}, expected RELEASED_TO_SELLER`);
    process.exit(1);
  }
  console.log('Escrow manually released. PASSED');

  console.log('\n--- ALL ESCROW TESTS PASSED! ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
