import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function main() {
  const auctions = await prisma.auction.findMany({ where: { status: 'ACTIVE' }, take: 1 });
  if (auctions.length === 0) return;
  const auction = auctions[0];
  const auctionId = auction.id;

  // Set endTime to 10 seconds from now
  const nearEnd = new Date(Date.now() + 10000);
  await prisma.auction.update({
    where: { id: auctionId },
    data: { endTime: nearEnd }
  });
  console.log(`Updated auction ${auctionId} to end in 10s: ${nearEnd.toISOString()}`);

  const bidders = await prisma.user.findMany({ take: 1 });
  const token = tokenService.signAccessToken({ userId: bidders[0].id, email: bidders[0].email });

  console.log('Placing bid near end...');
  const res = await fetch(`http://localhost:4000/v1/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amountCents: 25000,
      isProxy: false,
      idempotencyKey: `sniping-${Date.now()}`
    })
  });

  const data: any = await res.json();
  console.log('Bid Result:', res.status, data);

  const finalRes = await fetch(`http://localhost:4000/v1/auctions/${auctionId}`);
  const finalAuction: any = await finalRes.json();
  console.log('New End Time:', finalAuction.endTime);
  
  const oldEnd = nearEnd.getTime();
  const newEnd = new Date(finalAuction.endTime).getTime();
  
  if (newEnd > oldEnd) {
    console.log(`SUCCESS: Auction extended by ${(newEnd - oldEnd) / 1000}s`);
  } else {
    console.log('FAILURE: Auction was not extended');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
