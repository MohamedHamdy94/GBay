import { fetchApi } from '../apps/web/lib/api';
import { randomUUID } from 'node:crypto';

async function runE2E() {
  console.log('--- Starting E2E Verification ---');

  const API_URL = 'http://localhost:4000/v1';

  // 1. Register Seller
  console.log('1. Registering Seller...');
  const sellerEmail = `seller-${Date.now()}@example.com`;
  const sellerRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'Password123!',
      preferredLanguage: 'en',
    }),
  });
  if (!sellerRegisterRes.ok) throw new Error('Seller registration failed');
  const sellerAuth = await sellerRegisterRes.json();
  const sellerToken = sellerAuth.accessToken;
  console.log('   Seller registered.');

  // 2. Seller Onboarding
  console.log('2. Submitting Seller Onboarding...');
  const onboardingRes = await fetch(`${API_URL}/seller/onboarding/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      displayName: 'E2E Seller',
      businessName: 'E2E Store',
      businessType: 'INDIVIDUAL',
      countryCode: 'US',
      payoutCurrency: 'EUR',
    }),
  });
  if (!onboardingRes.ok) throw new Error('Seller onboarding failed');
  const sellerProfile = await onboardingRes.json();
  console.log('   Onboarding submitted.');

  // 3. Admin Approve Seller
  console.log('3. Approving Seller (Admin)...');
  const approveRes = await fetch(`${API_URL}/admin/sellers/${sellerProfile.id}/verification/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Action-Key': 'dev-admin-action-key',
      'Authorization': `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ reason: 'E2E Test' }),
  });
  if (!approveRes.ok) {
    const err = await approveRes.json();
    console.error('   Approval error:', err);
    throw new Error('Seller approval failed');
  }
  console.log('   Seller approved.');

  // 4. Create Auction Product
  console.log('4. Creating Auction Product...');
  // First, get a category ID
  const catRes = await fetch(`${API_URL}/catalog/categories`);
  const categories = await catRes.json();
  const categoryId = categories[0].id;

  const productRes = await fetch(`${API_URL}/catalog/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      sellerId: sellerProfile.id,
      condition: 'NEW',
      categoryId,
      translations: [
        {
          locale: 'en',
          title: 'E2E Auction Item',
          description: 'A high-value item for testing',
          slug: `e2e-auction-${Date.now()}`,
        }
      ],
      listing: {
        type: 'AUCTION',
        startingBidCents: 1000, // 10.00 EUR
        reservePriceCents: 5000, // 50.00 EUR
        auctionDurationDays: 3,
        quantityTotal: 1,
      }
    }),
  });
  if (!productRes.ok) {
    const err = await productRes.json();
    console.error('   Product creation error:', err);
    throw new Error('Product creation failed');
  }
  const product = await productRes.json();
  const listingId = product.listings[0].id;
  const auctionId = product.listings[0].auction.id;
  console.log(`   Auction product created (ID: ${product.id}, Auction ID: ${auctionId}).`);

  // 5. Register Buyer
  console.log('5. Registering Buyer...');
  const buyerEmail = `buyer-${Date.now()}@example.com`;
  const buyerRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyerEmail,
      password: 'Password123!',
      preferredLanguage: 'en',
    }),
  });
  const buyerAuth = await buyerRegisterRes.json();
  const buyerToken = buyerAuth.accessToken;
  console.log('   Buyer registered.');

  // 6. Place Bid
  console.log('6. Placing Bid...');
  const bidRes = await fetch(`${API_URL}/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      amountCents: 1500, // 15.00 EUR
      isProxy: false,
      idempotencyKey: randomUUID(),
    }),
  });
  if (!bidRes.ok) {
    const err = await bidRes.json();
    console.error('   Bid error:', err);
    throw new Error('Bidding failed');
  }
  console.log('   Bid placed successfully.');

  // 7. Initiate Checkout (Testing Buy It Now or Mock flow)
  // We'll test the Buy It Now flow for this product if we add a buyNowPrice, 
  // but since it's an auction, let's verify the bid was recorded.
  
  // Actually, let's create a BUY_NOW product to test the Mock Payment flow 
  // which we just implemented in the frontend.
  console.log('7. Creating Buy It Now Product...');
  const binProductRes = await fetch(`${API_URL}/catalog/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      sellerId: sellerProfile.id,
      condition: 'NEW',
      categoryId,
      translations: [
        {
          locale: 'en',
          title: 'E2E Buy Now Item',
          description: 'Testing checkout flow',
          slug: `e2e-bin-${Date.now()}`,
        }
      ],
      listing: {
        type: 'BUY_NOW',
        buyNowPriceCents: 2000,
        quantityTotal: 5,
      }
    }),
  });
  const binProduct = await binProductRes.json();
  const binListingId = binProduct.listings[0].id;
  console.log('   Buy It Now product created.');

  // 8. Add to Cart
  console.log('8. Adding to Cart...');
  const cartRes = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      listingId: binListingId,
      quantity: 1,
    }),
  });
  if (!cartRes.ok) throw new Error('Adding to cart failed');
  console.log('   Item added to cart.');

  // 9. Initiate Checkout
  console.log('9. Initiating Checkout...');
  const checkoutInitRes = await fetch(`${API_URL}/checkout/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      cartId: (await (await fetch(`${API_URL}/cart`, { headers: { 'Authorization': `Bearer ${buyerToken}` } })).json()).id,
      idempotencyKey: randomUUID(),
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
      },
    }),
  });
  if (!checkoutInitRes.ok) throw new Error('Checkout initiation failed');
  const session = await checkoutInitRes.json();
  console.log(`   Checkout initiated (Session ID: ${session.id}).`);

  // 10. Confirm Checkout (Mock Payment)
  console.log('10. Confirming Checkout...');
  const confirmRes = await fetch(`${API_URL}/checkout/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      checkoutSessionId: session.id,
    }),
  });
  if (!confirmRes.ok) {
    const err = await confirmRes.json();
    console.error('    Confirm error:', err);
    throw new Error('Checkout confirmation failed');
  }
  const confirmation = await confirmRes.json();
  console.log(`    Checkout confirmed! Order IDs: ${confirmation.orderIds.join(', ')}`);

  // 11. Final Verification
  console.log('11. Final Verification...');
  const finalProductRes = await fetch(`${API_URL}/catalog/products/${binProduct.id}`);
  const finalProduct = await finalProductRes.json();
  console.log(`    Listing quantity remaining: ${finalProduct.listings[0].quantityAvailable}`);
  
  if (finalProduct.listings[0].quantityAvailable === 4) {
    console.log('--- E2E Verification SUCCESSFUL ---');
  } else {
    console.error('--- E2E Verification FAILED: Quantity mismatch ---');
  }
}

runE2E().catch(err => {
  console.error('--- E2E Verification FAILED ---');
  console.error(err);
  process.exit(1);
});
