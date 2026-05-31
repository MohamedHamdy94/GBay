import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function main() {
  console.log('--- Buy It Now Verification ---');

  // 1. Setup - find or create a user and a product
  let user = await prisma.user.findFirst({ where: { email: 'buyer@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'buyer@example.com',
        name: 'Test Buyer',
        passwordHash: 'hashed',
        status: 'ACTIVE',
      }
    });
  }

  let seller: any = await prisma.user.findFirst({ where: { email: 'seller@example.com' }, include: { sellerProfile: true } });
  if (!seller) {
    seller = await prisma.user.create({
      data: {
        email: 'seller@example.com',
        name: 'Test Seller',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        sellerProfile: {
          create: {
            displayName: 'Test Shop',
            businessType: 'INDIVIDUAL',
            status: 'APPROVED',
          }
        }
      },
      include: { sellerProfile: true }
    });
  }

  const sellerProfileId = seller.sellerProfile!.id;

  // 2. Create a category if not exists
  let category = await prisma.category.findFirst({ where: { key: 'test-category' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        key: 'test-category',
        translations: {
          create: { locale: 'en', name: 'Test Category', slug: 'test-category' }
        }
      }
    });
  }

  // 3. Create a product with Buy It Now listing
  console.log('Creating test product...');
  const product = await prisma.product.create({
    data: {
      sellerId: sellerProfileId,
      status: 'ACTIVE',
      categoryId: category.id,
      condition: 'NEW',
      translations: {
        create: { locale: 'en', title: 'Buy It Now Item', slug: `bin-item-${Date.now()}`, description: 'Test item' }
      },
      listings: {
        create: {
          sellerId: sellerProfileId,
          status: 'ACTIVE',
          type: 'BUY_NOW',
          buyNowPriceCents: 5000,
          quantityTotal: 5,
          quantityAvailable: 5,
        }
      }
    },
    include: { listings: true }
  });

  const listingId = product.listings[0].id;
  console.log(`Created product ${product.id} with listing ${listingId}`);

  // 4. Get Auth Token
  const token = tokenService.signAccessToken({ userId: user.id, email: user.email! });

  const apiFetch = async (url: string, method: string, body: any) => {
    const res = await fetch(`http://localhost:4000/v1${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // 5. Attempt Reservation
  console.log('--- Step 1: Reserve Item ---');
  const idempotencyKey = `reserve-${Date.now()}`;
  const res1: any = await apiFetch('/commerce/reserve', 'POST', {
    listingId,
    quantity: 2,
    idempotencyKey,
  });
  console.log('Reservation Result:', res1.status, res1.data);

  if (res1.status !== 201) {
    throw new Error(`Reservation failed with status ${res1.status}`);
  }

  // 6. Verify Database State
  const updatedListing = await prisma.listing.findUnique({ where: { id: listingId } });
  console.log('Updated Listing quantityAvailable:', updatedListing?.quantityAvailable);
  if (updatedListing?.quantityAvailable !== 3) {
    throw new Error(`Expected quantity 3, got ${updatedListing?.quantityAvailable}`);
  }

  // 7. Test Idempotency
  console.log('--- Step 2: Test Idempotency ---');
  const res2: any = await apiFetch('/commerce/reserve', 'POST', {
    listingId,
    quantity: 2,
    idempotencyKey,
  });
  console.log('Idempotency Result:', res2.status, res2.data);
  if (res2.status !== 201 || res2.data.id !== res1.data.id) {
    throw new Error('Idempotency failed');
  }

  // 8. Test Out of Stock
  console.log('--- Step 3: Test Out of Stock ---');
  const res3 = await apiFetch('/commerce/reserve', 'POST', {
    listingId,
    quantity: 4,
    idempotencyKey: `reserve-fail-${Date.now()}`,
  });
  console.log('Out of Stock Result:', res3.status, res3.data);
  if (res3.status !== 409) {
    throw new Error('Expected 409 for out of stock');
  }

  // 9. Sell Out
  console.log('--- Step 4: Sell Out ---');
  const res4 = await apiFetch('/commerce/reserve', 'POST', {
    listingId,
    quantity: 3,
    idempotencyKey: `reserve-sellout-${Date.now()}`,
  });
  console.log('Sell Out Result:', res4.status, res4.data);
  
  const finalListing = await prisma.listing.findUnique({ where: { id: listingId } });
  console.log('Final Listing status:', finalListing?.status);
  if (finalListing?.status !== 'SOLD') {
    throw new Error('Expected status SOLD');
  }

  console.log('Verification Passed!');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
