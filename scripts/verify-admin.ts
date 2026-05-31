import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function getAdminToken() {
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
    include: { roles: { include: { role: true } } }
  });

  if (!adminUser) throw new Error('Admin user not found');

  return tokenService.signAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    roles: adminUser.roles.map(r => r.role.key)
  });
}

async function verify() {
  const token = await getAdminToken();
  const baseUrl = 'http://localhost:4000/v1/admin';

  console.log('--- Testing Admin Dashboard ---');
  const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashboard = await dashboardRes.json();
  console.log('Dashboard Metrics:', dashboard);
  if (dashboardRes.status !== 200) throw new Error('Failed to fetch dashboard');

  console.log('\n--- Testing List Users ---');
  const usersRes = await fetch(`${baseUrl}/users?take=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const users = await usersRes.json();
  console.log(`Found ${users.total} users, showing ${users.items.length}`);
  if (usersRes.status !== 200) throw new Error('Failed to list users');

  console.log('\n--- Testing Feature Flags ---');
  const flagName = `TEST_FLAG_${Date.now()}`;
  const updateFlagRes = await fetch(`${baseUrl}/feature-flags/${flagName}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: true })
  });
  const flag = await updateFlagRes.json();
  console.log('Updated Flag:', flag);
  if (updateFlagRes.status !== 200) throw new Error('Failed to update feature flag');

  console.log('\n--- Testing Audit Logs ---');
  const auditRes = await fetch(`${baseUrl}/audit-log?take=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const auditLogs = await auditRes.json();
  console.log('Latest Audit Log:', auditLogs.items[0]);
  if (auditRes.status !== 200) throw new Error('Failed to fetch audit logs');

  if (auditLogs.items[0]?.action !== 'UPDATE_FEATURE_FLAG') {
    throw new Error('Audit log not found for flag update');
  }

  console.log('\n✅ Admin Panel verified successfully!');
}

verify()
  .catch(err => {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
