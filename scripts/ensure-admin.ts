import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: {},
    create: { key: 'ADMIN', name: 'Administrator' }
  });

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@example.com' }
  });

  if (!adminUser) {
    const newUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'System Admin',
        status: 'ACTIVE',
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    });
    console.log(`Created admin user: ${newUser.id}`);
  } else {
    // Ensure it has the admin role
    const hasRole = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } }
    });
    if (!hasRole) {
      await prisma.userRole.create({
        data: { userId: adminUser.id, roleId: adminRole.id }
      });
      console.log(`Added admin role to user: ${adminUser.id}`);
    } else {
      console.log(`Admin user already exists: ${adminUser.id}`);
    }
  }

  // Create/Approve Seller Profile for Admin to bypass guards in tests
  const finalAdmin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (finalAdmin) {
    const seller = await prisma.sellerProfile.upsert({
      where: { userId: finalAdmin.id },
      update: { status: 'APPROVED' },
      create: {
        userId: finalAdmin.id,
        displayName: 'System Admin Seller',
        businessType: 'INDIVIDUAL',
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });
    console.log(`Admin seller profile: ${seller.id} (${seller.status})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
