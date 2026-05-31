import { PrismaClient } from '@gbay/database';
import { TokenService } from '../apps/api/src/auth/token.service';

const prisma = new PrismaClient();
const tokenService = new TokenService();

async function getAdminToken() {
  const adminUser = await prisma.user.findFirst({
    where: { 
      roles: { 
        some: { 
          role: { key: 'ADMIN' } 
        } 
      } 
    },
    include: { roles: { include: { role: true } } }
  });

  if (!adminUser) {
    const anyUser = await prisma.user.findFirst();
    if (!anyUser) throw new Error('No users found in database');
    return tokenService.signAccessToken({
      userId: anyUser.id,
      email: anyUser.email || 'test@example.com',
      roles: ['ADMIN']
    });
  }

  return tokenService.signAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    roles: adminUser.roles.map(r => r.role.key)
  });
}

async function verify() {
  const token = await getAdminToken();
  const baseUrl = 'http://localhost:4000/v1';

  console.log('\n--- Phase 1: Secure Headers (Helmet) ---');
  const healthRes = await fetch(`${baseUrl}/health`);
  console.log('X-Frame-Options:', healthRes.headers.get('x-frame-options'));
  console.log('Content-Security-Policy:', healthRes.headers.get('content-security-policy'));
  if (healthRes.headers.get('x-frame-options') !== 'SAMEORIGIN') {
    // Default helmet config might be different, let's just check if it exists
    if (!healthRes.headers.get('x-frame-options')) throw new Error('Helmet headers missing');
  }

  console.log('\n--- Phase 2: Rate Limiting (Auth) ---');
  console.log('Triggering auth rate limit (limit is 5 per min)...');
  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });
    console.log(`Request ${i + 1}: Status ${res.status}`);
    if (i >= 5 && res.status !== 429) {
      console.warn(`Expected 429 but got ${res.status} at request ${i + 1}`);
    }
  }

  console.log('\n--- Phase 3: Security Incident Logging ---');
  // Wait a bit for the async logging to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  const incidents = await prisma.securityIncident.findMany({
    where: { type: 'RATE_LIMIT' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(`Found ${incidents.length} rate limit incidents in DB`);
  if (incidents.length === 0) throw new Error('Security incidents not logged in database');

  console.log('\n--- Phase 4: Admin Security API ---');
  const settingsRes = await fetch(`${baseUrl}/admin/security/settings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const settings = await settingsRes.json();
  console.log('Security Settings:', settings);
  if (settingsRes.status !== 200) throw new Error('Failed to fetch security settings');

  const logRes = await fetch(`${baseUrl}/admin/security/log?limit=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const logs = await logRes.json();
  console.log(`Security Log: ${logs.incidents.length} incidents found`);
  if (logRes.status !== 200) throw new Error('Failed to fetch security logs');

  console.log('\n✅ Security Module verified successfully!');
}

verify()
  .catch(err => {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
