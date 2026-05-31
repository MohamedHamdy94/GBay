import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function getAuthToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);
  return tokenService.signAccessToken({ userId: user.id, email: user.email });
}

async function main() {
  const auctions = await prisma.auction.findMany({ where: { status: 'ACTIVE' }, take: 1 });
  if (auctions.length === 0) {
    console.log('No active auctions found. Please run seed-auctions.ts first.');
    return;
  }
  const auctionId = auctions[0].id;
  console.log(`Testing bidding on auction: ${auctionId}`);

  // Get tokens for two different bidders
  const bidders = await prisma.user.findMany({ take: 2 });
  if (bidders.length < 2) {
    console.log('Need at least 2 users for bidding test.');
    return;
  }

  const token1 = tokenService.signAccessToken({ userId: bidders[0].id, email: bidders[0].email });
  const token2 = tokenService.signAccessToken({ userId: bidders[1].id, email: bidders[1].email });

  const apiFetch = async (url: string, method: string, body: any, token: string) => {
    const res = await fetch(`http://localhost:4000/v1${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  console.log('--- Step 1: Normal Bid ---');
  const bid1 = await apiFetch(`/auctions/${auctionId}/bid`, 'POST', {
    amountCents: 11000,
    isProxy: false,
    idempotencyKey: 'bid-1'
  }, token1);
  console.log('Bid 1 Result:', bid1.status, bid1.data);

  console.log('--- Step 2: Proxy Bid ---');
  const bid2 = await apiFetch(`/auctions/${auctionId}/bid`, 'POST', {
    amountCents: 20000,
    isProxy: true,
    idempotencyKey: 'bid-2'
  }, token2);
  console.log('Bid 2 Result (Proxy):', bid2.status, bid2.data);

  console.log('--- Step 3: Outbidding Proxy ---');
  const bid3 = await apiFetch(`/auctions/${auctionId}/bid`, 'POST', {
    amountCents: 15000,
    isProxy: false,
    idempotencyKey: 'bid-3'
  }, token1);
  console.log('Bid 3 Result (Should be outbid by auto-bid):', bid3.status, bid3.data);

  const finalRes = await fetch(`http://localhost:4000/v1/auctions/${auctionId}`);
  console.log('Final Auction State:', await finalRes.json());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
