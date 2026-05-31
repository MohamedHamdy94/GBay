import { PrismaClient, RecommendationType } from '@gbay/database';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'dev-access-secret-change-before-production';

async function main() {
  console.log('--- Module 18: AI Recommendations Verification ---');

  // 1. Setup Users
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (!admin) throw new Error('Run ensure-admin.ts first');
  const adminToken = jwt.sign({ sub: admin.id, email: admin.email }, JWT_SECRET);

  const buyer = await prisma.user.findFirst({ where: { email: 'buyer@example.com' } });
  if (!buyer) throw new Error('Run seed-recommendations.ts first');
  const buyerToken = jwt.sign({ sub: buyer.id, email: buyer.email }, JWT_SECRET);

  const apiFetch = async (url: string, method: string, token: string, body?: any, adminKey?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    if (adminKey) {
        headers['x-admin-action-key'] = adminKey;
    }

    const res = await fetch(`http://localhost:4000/v1${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!res.ok) {
        const error = await res.text();
        console.error(`Request failed: ${url} (${res.status})`, error);
        return { status: res.status, data: null, ok: false };
    }

    const data = res.status !== 204 ? await res.json() : null;
    return { status: res.status, data, ok: true };
  };

  console.log('--- Step 1: Refresh Recommendations (Admin) ---');
  const refresh = await apiFetch('/recommendations/admin/refresh', 'POST', adminToken, {}, 'dev-admin-action-key');
  if (!refresh.ok) throw new Error('Refresh failed');
  console.log('Refresh triggered successfully.');

  // Give it a moment to process if it's asynchronous, although the controller waits for it.
  // Actually, wait a bit just in case.
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('--- Step 2: GET Trending Recommendations ---');
  const trending = await apiFetch('/recommendations?type=TRENDING', 'GET', buyerToken);
  if (!trending.ok) throw new Error('Trending recommendations failed');
  const trendingData = trending.data as any[];
  console.log(`Found ${trendingData.length} trending items.`);
  if (trendingData.length === 0) {
      console.warn('WARNING: No trending items found. Check if trending logic is working.');
  } else {
      console.log('Sample trending item:', trendingData[0].id);
  }

  console.log('--- Step 3: GET Based on History Recommendations ---');
  const history = await apiFetch('/recommendations?type=BASED_ON_HISTORY', 'GET', buyerToken);
  if (!history.ok) throw new Error('History-based recommendations failed');
  const historyData = history.data as any[];
  console.log(`Found ${historyData.length} items based on history.`);
  if (historyData.length === 0) {
      console.warn('WARNING: No history-based items found.');
  }

  console.log('--- Step 4: GET Similar Products ---');
  const listing = await prisma.listing.findFirst({ where: { status: 'ACTIVE' } });
  if (listing) {
      const similar = await apiFetch(`/recommendations?type=SIMILAR_PRODUCTS&productId=${listing.id}`, 'GET', buyerToken);
      if (!similar.ok) throw new Error('Similar products failed');
      const similarData = similar.data as any[];
      console.log(`Found ${similarData.length} similar items for product ${listing.id}.`);
  } else {
      console.log('No active listing found to test similar products.');
  }

  console.log('--- ALL RECOMMENDATION TESTS PASSED! ---');
}

main()
  .catch((e) => {
    console.error('Verification Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
