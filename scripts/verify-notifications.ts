import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function main() {
  console.log('--- Module 16: Notifications Verification ---');

  // 1. Setup Users
  console.log('--- Step 0: Setup Users ---');
  const buyerEmail = `buyer-notify-${Date.now()}@example.com`;
  const sellerEmail = `seller-notify-${Date.now()}@example.com`;

  const buyer = await prisma.user.create({
    data: {
      email: buyerEmail,
      name: 'Buyer Notify',
      passwordHash: 'hashed',
      status: 'ACTIVE',
    }
  });

  const seller = await prisma.user.create({
    data: {
      email: sellerEmail,
      name: 'Seller Notify',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      sellerProfile: {
        create: {
          displayName: 'Notify Shop',
          businessType: 'INDIVIDUAL',
          status: 'APPROVED',
        }
      }
    },
    include: { sellerProfile: true }
  });

  const buyerToken = tokenService.signAccessToken({ userId: buyer.id, email: buyer.email! });
  const sellerToken = tokenService.signAccessToken({ userId: seller.id, email: seller.email! });

  const apiFetch = async (url: string, method: string, token: string, body?: any) => {
    const res = await fetch(`http://localhost:4000/v1${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = res.status !== 204 ? await res.json() : null;
    return { status: res.status, data };
  };

  console.log('--- Step 1: Initial Notifications List ---');
  const initial = await apiFetch('/notifications', 'GET', buyerToken);
  console.log('Initial Response:', initial.status, initial.data);
  console.log(`Initial buyer notifications count: ${initial.data?.length} (Expected: 0)`);
  if (!initial.data || initial.data.length !== 0) throw new Error(`Should have no notifications initially. Got status ${initial.status}`);

  const unreadCount = await apiFetch('/notifications/unread-count', 'GET', buyerToken);
  console.log(`Initial unread count: ${unreadCount.data.count} (Expected: 0)`);

  console.log('--- Step 2: Trigger Order Notification ---');
  // 2.1 Setup Category and Product
  let category = await prisma.category.findFirst({ where: { key: 'notify-cat' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        key: 'notify-cat',
        translations: { create: { locale: 'en', name: 'Notify Category', slug: 'notify-cat' } }
      }
    });
  }

  const product = await prisma.product.create({
    data: {
      sellerId: seller.sellerProfile!.id,
      status: 'ACTIVE',
      categoryId: category.id,
      condition: 'NEW',
      translations: {
        create: { locale: 'en', title: 'Notify Item', slug: `notify-item-${Date.now()}`, description: 'Test' }
      },
      listings: {
        create: {
          sellerId: seller.sellerProfile!.id,
          status: 'ACTIVE',
          type: 'BUY_NOW',
          buyNowPriceCents: 1000,
          quantityTotal: 5,
          quantityAvailable: 5,
        }
      }
    },
    include: { listings: true }
  });
  const listingId = product.listings[0].id;

  // 2.2 Trigger Checkout and Confirmation
  const cartRes = await apiFetch('/cart', 'GET', buyerToken);
  let cartId = cartRes.data?.id;
  if (!cartId) {
    // Should have a cart automatically or need to create one? 
    // In our system, GET /cart usually returns or creates one for the user.
    // Let's assume it returns one.
  }

  // Add item to cart
  await apiFetch('/cart/items', 'POST', buyerToken, {
    listingId,
    quantity: 1,
  });

  const checkout = await apiFetch('/checkout/initiate', 'POST', buyerToken, {
    cartId,
    idempotencyKey: `checkout-${Date.now()}`,
    shippingAddress: { street: '123 Test St', city: 'Test City', country: 'Test Land' }
  });
  
  if (checkout.status !== 201) {
    console.error('Checkout Initiation Failed:', checkout.status, checkout.data);
    throw new Error('Checkout initiation failed');
  }

  await apiFetch('/checkout/confirm', 'POST', buyerToken, {
    checkoutSessionId: checkout.data.id,
    paymentMethod: 'STRIPE_TEST',
  });

  console.log('--- Step 3: Verify "Order Confirmed" Notification for Seller ---');
  // Wait a bit for async listener
  await new Promise(r => setTimeout(r, 2000));
  
  const sellerNotifs = await apiFetch('/notifications', 'GET', sellerToken);
  console.log(`Seller notifications count: ${sellerNotifs.data.length}`);
  const orderNotif = sellerNotifs.data.find((n: any) => n.type === 'ORDER_CONFIRMED');
  if (!orderNotif) throw new Error('Seller should have ORDER_CONFIRMED notification');
  console.log(`Found notification: ${orderNotif.title} - ${orderNotif.body}`);

  console.log('--- Step 4: Verify "New Message" Notification ---');
  const buyerOrders = await apiFetch('/orders', 'GET', buyerToken);
  const orderId = buyerOrders.data[0].id;

  const thread = await apiFetch('/messages/threads', 'POST', buyerToken, {
    orderId,
    body: 'Hello from buyer',
  });
  
  await apiFetch(`/messages/threads/${thread.data.id}/messages`, 'POST', sellerToken, {
    body: 'Reply from seller',
  });

  await new Promise(r => setTimeout(r, 1000));

  const buyerNotifs = await apiFetch('/notifications', 'GET', buyerToken);
  const msgNotif = buyerNotifs.data.find((n: any) => n.type === 'MESSAGE_RECEIVED');
  if (!msgNotif) throw new Error('Buyer should have MESSAGE_RECEIVED notification');
  console.log(`Found notification: ${msgNotif.title} - ${msgNotif.body}`);

  console.log('--- Step 5: Mark as Read ---');
  await apiFetch(`/notifications/${msgNotif.id}/read`, 'PATCH', buyerToken);
  
  const unreadAfter = await apiFetch('/notifications/unread-count', 'GET', buyerToken);
  console.log(`Unread count after marking one as read: ${unreadAfter.data.count}`);

  console.log('--- Step 6: Mark All as Read ---');
  await apiFetch('/notifications/read-all', 'PATCH', buyerToken);
  
  const unreadFinal = await apiFetch('/notifications/unread-count', 'GET', buyerToken);
  console.log(`Final unread count: ${unreadFinal.data.count}`);
  if (unreadFinal.data.count !== 0) throw new Error('Unread count should be 0');

  console.log('--- ALL NOTIFICATION TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
