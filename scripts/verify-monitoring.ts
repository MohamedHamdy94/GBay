import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/v1';
const ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY || 'dev-admin-action-key';

async function verifyMonitoring() {
  console.log('--- Verifying Admin Monitoring Endpoints ---');

  const adminHeaders = { 'x-admin-action-key': ADMIN_ACTION_KEY };

  try {
    // 1. Metrics Summary
    console.log('\n1. Verifying Metrics Summary...');
    const summaryRes = await axios.get(`${API_URL}/admin/monitoring/metrics/summary`, { headers: adminHeaders });
    console.log('Summary:', summaryRes.data);
    if (summaryRes.data.uptime && summaryRes.data.memoryUsage) {
      console.log('✅ Metrics summary verified');
    }

    // 2. Health Detailed
    console.log('\n2. Verifying Detailed Health...');
    const healthRes = await axios.get(`${API_URL}/admin/monitoring/health`, { headers: adminHeaders });
    console.log('Health:', JSON.stringify(healthRes.data, null, 2));
    if (healthRes.data.status === 'ok' && healthRes.data.info.database) {
      console.log('✅ Detailed health verified');
    }

    // 3. Recent Errors
    console.log('\n3. Verifying Recent Errors...');
    const errorsRes = await axios.get(`${API_URL}/admin/monitoring/errors`, { headers: adminHeaders });
    console.log('Errors Array Length:', errorsRes.data.length);
    console.log('✅ Recent errors verified');

  } catch (err: any) {
    console.error('❌ Monitoring verification failed:', err.response?.data || err.message);
  }
}

verifyMonitoring();
