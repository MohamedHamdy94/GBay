import { PrismaClient } from '@gbay/database';
import { createHmac } from 'node:crypto';

const prisma = new PrismaClient();

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
  console.log('--- Module 15: Messaging Verification ---');

  // 1. Setup Actors
  const seller = await prisma.sellerProfile.findFirst({ 
    where: { status: 'APPROVED' },
    include: { user: true }
  });
  const buyer = await prisma.user.findFirst({ where: { email: { startsWith: 'buyer' } } });

  if (!seller || !buyer) {
    throw new Error('Not enough actors. Run seeds first.');
  }

  const buyerToken = signAccessToken({ userId: buyer.id, email: buyer.email });
  const sellerToken = signAccessToken({ userId: seller.userId, email: seller.user.email });

  console.log(`Using Buyer: ${buyer.email}`);
  console.log(`Using Seller: ${seller.user.email}`);

  // Create an order for the thread
  const listing = await prisma.listing.findFirst({ where: { sellerId: seller.id } });
  if (!listing) throw new Error('No listing found. Run seed-products.ts first.');

  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      sellerId: seller.id,
      totalAmountCents: 1000,
      currency: 'EUR',
      status: 'DELIVERED',
      shippingAddress: { city: 'Munich' },
      items: {
        create: {
          listingId: listing.id,
          productTitleSnapshot: 'Message Test Item',
          quantity: 1,
          priceCentsPerUnit: 1000,
        }
      }
    }
  });

  // 2. Buyer creates a thread for the order
  console.log('\n--- Step 1: Buyer Create Thread ---');
  const threadRes = await apiFetch('/messages/threads', 'POST', {
    orderId: order.id,
    subject: 'Question about delivery',
    body: 'Hi, I received the item but it is missing the manual.'
  }, buyerToken);

  if (threadRes.status !== 201) throw new Error(`Create thread failed: ${JSON.stringify(threadRes.data)}`);
  const thread = threadRes.data;
  console.log(`Thread created: ${thread.id}`);

  // 3. Seller sends a reply
  console.log('\n--- Step 2: Seller Send Message ---');
  const replyRes = await apiFetch(`/messages/threads/${thread.id}/messages`, 'POST', {
    body: 'Sorry about that! I will send the PDF version right away.'
  }, sellerToken);

  if (replyRes.status !== 201) throw new Error(`Seller reply failed: ${JSON.stringify(replyRes.data)}`);
  console.log('Seller reply sent: PASSED');

  // 4. Buyer fetches threads
  console.log('\n--- Step 3: Buyer Fetch Threads ---');
  const myThreadsRes = await apiFetch('/messages/threads', 'GET', null, buyerToken);
  if (myThreadsRes.status !== 200) throw new Error('Fetch threads failed');
  const hasThread = myThreadsRes.data.some((t: any) => t.id === thread.id);
  if (!hasThread) throw new Error('Thread not found in buyer list');
  console.log('Buyer found thread in list: PASSED');

  // 5. Buyer fetches thread details
  console.log('\n--- Step 4: Buyer Fetch Thread Details ---');
  const detailsRes = await apiFetch(`/messages/threads/${thread.id}`, 'GET', null, buyerToken);
  if (detailsRes.status !== 200) throw new Error('Fetch details failed');
  if (detailsRes.data.messages.length !== 2) throw new Error(`Expected 2 messages, got ${detailsRes.data.messages.length}`);
  console.log('Buyer fetched thread details with messages: PASSED');

  // 6. Integration: Dispute creates thread automatically
  console.log('\n--- Step 5: Integration - Dispute creates thread ---');
  // We need a refund to escalate to dispute
  const refund = await prisma.refund.create({
    data: {
      orderId: order.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      amountCents: 1000,
      currency: 'EUR',
      idempotencyKey: `msg-test-${Date.now()}`,
      status: 'ESCALATED',
    }
  });

  const disputeRes = await apiFetch('/disputes', 'POST', { 
    refundId: refund.id, 
    reason: 'OTHER',
    description: 'Manual still missing after 2 days.'
  }, buyerToken);
  
  if (disputeRes.status !== 201) throw new Error(`Open dispute failed: ${JSON.stringify(disputeRes.data)}`);
  const dispute = disputeRes.data;

  // Check if a new thread was created for this dispute
  const disputeThreadsRes = await apiFetch('/messages/threads', 'GET', null, buyerToken);
  const disputeThread = disputeThreadsRes.data.find((t: any) => t.disputeId === dispute.id);
  if (!disputeThread) throw new Error('Dispute thread not created automatically');
  console.log(`Dispute thread created automatically: ${disputeThread.id}: PASSED`);

  // 7. Close Thread
  console.log('\n--- Step 6: Close Thread ---');
  const closeRes = await apiFetch(`/messages/threads/${thread.id}/close`, 'PATCH', null, buyerToken);
  if (closeRes.status !== 200) throw new Error('Close thread failed');
  
  const closedThreadRes = await apiFetch(`/messages/threads/${thread.id}/messages`, 'POST', {
    body: 'Try to send message to closed thread'
  }, sellerToken);
  if (closedThreadRes.status !== 409) throw new Error('Should not be able to message closed thread');
  console.log('Closed thread blocks new messages: PASSED');

  console.log('\n--- ALL MESSAGING TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
