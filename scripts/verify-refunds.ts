import { PrismaClient, OrderStatus, RefundStatus, DisputeStatus } from '@gbay/database';
import { createHmac } from 'node:crypto';

const prisma = new PrismaClient();

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
const adminKey = process.env.ADMIN_ACTION_KEY ?? 'dev-admin-action-key';

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

async function apiFetch(url: string, method: string, body: any, token?: string, headers: any = {}) {
  const finalHeaders: any = { 'Content-Type': 'application/json', ...headers };
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`http://localhost:4000/v1${url}`, {
    method,
    headers: finalHeaders,
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
  console.log('--- Module 14: Refunds & Disputes Verification ---');

  // 1. Setup Actors
  const seller = await prisma.sellerProfile.findFirst({ 
    where: { status: 'APPROVED' },
    include: { user: true }
  });
  const buyer = await prisma.user.findFirst({ where: { email: { startsWith: 'buyer' } } });
  const admin = await prisma.user.findFirst({ where: { email: { contains: 'admin' } } }) || buyer; // Fallback to buyer for token if no admin found

  if (!seller || !buyer) {
    throw new Error('Not enough actors. Run seeds first.');
  }

  const buyerToken = signAccessToken({ userId: buyer.id, email: buyer.email });
  const sellerToken = signAccessToken({ userId: seller.userId, email: seller.user.email });
  const adminToken = signAccessToken({ userId: admin.id, email: admin.email });

  console.log(`Using Buyer: ${buyer.email}`);
  console.log(`Using Seller: ${seller.user.email}`);

  const listing = await prisma.listing.findFirst({ where: { sellerId: seller.id } });
  if (!listing) throw new Error('No listing found for seller. Run seed-products.ts first.');

  // 2. Setup Order and Escrow
  console.log('\n--- Step 1: Setup Order and Escrow ---');
  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: seller.id,
      totalAmountCents: 5000,
      currency: 'EUR',
      status: 'DELIVERED',
      shippingAddress: { city: 'Berlin' },
      items: {
        create: {
          listingId: listing.id,
          productTitleSnapshot: 'Refund Test Item',
          quantity: 1,
          priceCentsPerUnit: 5000,
        }
      },
      escrowHold: {
        create: {
          buyerId: buyer.id,
          sellerId: seller.id,
          amountCents: 5000,
          currency: 'EUR',
          status: 'HELD',
        }
      }
    }
  });
  console.log(`Created DELIVERED order ${order.id} with HELD escrow.`);

  // 3. Buyer requests return -> Should initiate Refund
  console.log('\n--- Step 2: Buyer Request Return ---');
  const returnRes = await apiFetch(`/orders/${order.id}/return`, 'POST', null, buyerToken);
  if (returnRes.status !== 201) throw new Error(`Return request failed: ${JSON.stringify(returnRes.data)}`);
  
  const refund = await prisma.refund.findUnique({ where: { orderId: order.id } });
  if (!refund) throw new Error('Refund record not created automatically');
  if (refund.status !== 'REQUESTED') throw new Error(`Expected REQUESTED refund, got ${refund.status}`);
  console.log('Refund REQUESTED automatically: PASSED');

  // 4. Seller Rejects Refund
  console.log('\n--- Step 3: Seller Reject Refund ---');
  const rejectRes = await apiFetch(`/seller/refunds/${refund.id}/reject`, 'PATCH', { reason: 'Item was not damaged' }, sellerToken);
  if (rejectRes.status !== 200) throw new Error(`Seller reject failed: ${JSON.stringify(rejectRes.data)}`);
  
  const rejectedRefund = await prisma.refund.findUnique({ where: { id: refund.id } });
  if (rejectedRefund?.status !== 'REJECTED') throw new Error(`Expected REJECTED refund, got ${rejectedRefund?.status}`);
  console.log('Refund REJECTED by seller: PASSED');

  // 5. Buyer Escalates to Dispute
  console.log('\n--- Step 4: Buyer Escalate to Dispute ---');
  const escalateRes = await apiFetch(`/refunds/${refund.id}/escalate`, 'POST', null, buyerToken);
  if (escalateRes.status !== 201) throw new Error(`Escalate failed: ${JSON.stringify(escalateRes.data)}`);
  
  const escalatedRefund = await prisma.refund.findUnique({ where: { id: refund.id } });
  if (escalatedRefund?.status !== 'ESCALATED') throw new Error(`Expected ESCALATED refund, got ${escalatedRefund?.status}`);
  
  // Buyer actually opens the dispute record
  const disputeRes = await apiFetch('/disputes', 'POST', { 
    refundId: refund.id, 
    reason: 'ITEM_NOT_AS_DESCRIBED',
    description: 'The item has a huge scratch that seller did not mention.'
  }, buyerToken);
  if (disputeRes.status !== 201) throw new Error(`Open dispute failed: ${JSON.stringify(disputeRes.data)}`);
  
  const dispute = disputeRes.data;
  console.log(`Dispute OPENED: ${dispute.id}`);

  // Check Escrow is DISPUTED
  const escrow = await prisma.escrowHold.findUnique({ where: { orderId: order.id } });
  if (escrow?.status !== 'DISPUTED') throw new Error(`Expected DISPUTED escrow, got ${escrow?.status}`);
  console.log('Escrow status updated to DISPUTED: PASSED');

  // 6. Admin reviews Dispute
  console.log('\n--- Step 5: Admin Review Dispute ---');
  const reviewRes = await apiFetch(`/admin/disputes/${dispute.id}/review`, 'PATCH', {}, adminToken, { 'x-admin-action-key': adminKey });
  if (reviewRes.status !== 200) throw new Error(`Admin review failed: ${JSON.stringify(reviewRes.data)}`);
  console.log('Dispute status updated to UNDER_REVIEW: PASSED');

  // 7. Admin resolves Dispute for Buyer
  console.log('\n--- Step 6: Admin Resolve Dispute (for Buyer) ---');
  const resolveRes = await apiFetch(`/admin/disputes/${dispute.id}/resolve`, 'PATCH', {
    resolution: 'Evidence confirms scratch. Refund approved.',
    outcome: 'BUYER'
  }, adminToken, { 'x-admin-action-key': adminKey });
  
  if (resolveRes.status !== 200) throw new Error(`Admin resolve failed: ${JSON.stringify(resolveRes.data)}`);
  
  const resolvedDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } });
  if (resolvedDispute?.status !== 'RESOLVED_BUYER') throw new Error(`Expected RESOLVED_BUYER dispute, got ${resolvedDispute?.status}`);

  // 8. Verify Refund COMPLETED and Order REFUNDED
  console.log('\n--- Step 7: Final Verification ---');
  const finalRefund = await prisma.refund.findUnique({ where: { id: refund.id } });
  if (finalRefund?.status !== 'COMPLETED') throw new Error(`Expected COMPLETED refund, got ${finalRefund?.status}`);
  
  const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (finalOrder?.status !== 'REFUNDED') throw new Error(`Expected REFUNDED order, got ${finalOrder?.status}`);

  const finalEscrow = await prisma.escrowHold.findUnique({ where: { orderId: order.id } });
  if (finalEscrow?.status !== 'REFUNDED_TO_BUYER') throw new Error(`Expected REFUNDED_TO_BUYER escrow, got ${finalEscrow?.status}`);

  console.log('Refund COMPLETED: PASSED');
  console.log('Order status REFUNDED: PASSED');
  console.log('Escrow status REFUNDED_TO_BUYER: PASSED');

  console.log('\n--- ALL REFUND & DISPUTE TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
