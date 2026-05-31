import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function main() {
  const seller = await prisma.sellerProfile.findFirst({
    include: { user: true }
  });

  if (!seller) {
    console.log('No seller found.');
    return;
  }

  const user = seller.user;
  const token = tokenService.signAccessToken({
    userId: user.id,
    email: user.email || null
  });

  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Token:', token);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
