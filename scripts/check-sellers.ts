import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  const seller = await prisma.sellerProfile.findFirst();
  if (seller) {
    console.log('Found seller:', JSON.stringify(seller, null, 2));
  } else {
    console.log('No seller found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
