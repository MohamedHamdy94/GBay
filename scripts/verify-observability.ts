import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/v1';
const ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY || 'dev-admin-action-key';

async function testObservability() {
  console.log('--- Testing Observability & Monitoring ---');

  // 1. Test Health Check
  try {
    console.log('\n1. Testing /health endpoint...');
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('Status:', healthRes.status);
    console.log('Health Data:', JSON.stringify(healthRes.data, null, 2));
    if (healthRes.data.status === 'ok') {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
  } catch (err: any) {
    console.error('❌ Health check failed:', err.response?.data || err.message);
  }

  // 2. Test Admin Detailed Health (requires Admin auth)
  // We'll use a simplified admin token generation or the ADMIN_ACTION_KEY if applicable
  // Usually the AdminGuard check for X-Admin-Action-Key or a valid JWT with ADMIN role
  try {
    console.log('\n2. Testing /admin/monitoring/health (unauthorized)...');
    await axios.get(`${API_URL}/admin/monitoring/health`);
    console.log('❌ Should have failed with 403');
  } catch (err: any) {
    console.log('✅ Properly blocked unauthorized access:', err.response?.status);
  }

  // 3. Test Admin Detailed Health (authorized)
  try {
    console.log('\n3. Testing /admin/monitoring/health (authorized with key)...');
    const adminRes = await axios.get(`${API_URL}/admin/monitoring/health`, {
      headers: { 'x-admin-action-key': ADMIN_ACTION_KEY }
    });
    console.log('Status:', adminRes.status);
    console.log('Detailed Health:', JSON.stringify(adminRes.data, null, 2));
    console.log('✅ Detailed health check passed');
  } catch (err: any) {
    console.error('❌ Detailed health check failed:', err.response?.data || err.message);
  }

  // 4. Test Metrics (authorized)
  try {
    console.log('\n4. Testing /metrics endpoint...');
    const metricsRes = await axios.get(`${API_URL}/metrics`, {
      headers: { 'x-admin-action-key': ADMIN_ACTION_KEY }
    });
    console.log('Status:', metricsRes.status);
    console.log('Metrics (first 500 chars):', metricsRes.data.substring(0, 500) + '...');
    if (metricsRes.data.includes('http_request_duration_seconds') || metricsRes.data.includes('process_cpu_seconds_total')) {
      console.log('✅ Prometheus metrics found');
    } else {
      console.log('❌ Metrics not found in response');
    }
  } catch (err: any) {
    console.error('❌ Metrics check failed:', err.response?.data || err.message);
  }

  // 5. Test Trace ID in headers
  try {
    console.log('\n5. Testing x-trace-id header...');
    const traceRes = await axios.get(`${API_URL}/health`);
    // Note: Trace ID might be in the request or response depending on how middleware is configured
    // Usually OTel or Pino adds it. 
    // If not in headers, it should be in the logs.
    console.log('Response Headers:', traceRes.headers);
    // Let's see if we added it to response
  } catch (err: any) {
    console.error('❌ Trace ID check failed:', err.message);
  }

  // 6. Test Error Tracking
  try {
    console.log('\n6. Testing /admin/monitoring/errors...');
    const errorsRes = await axios.get(`${API_URL}/admin/monitoring/errors`, {
      headers: { 'x-admin-action-key': ADMIN_ACTION_KEY }
    });
    console.log('Recent Errors Count:', errorsRes.data.length);
    console.log('✅ Error tracking check passed');
  } catch (err: any) {
    console.error('❌ Error tracking check failed:', err.response?.data || err.message);
  }

  console.log('\n--- Observability Testing Complete ---');
}

testObservability();
