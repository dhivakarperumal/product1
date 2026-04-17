const axios = require('axios');

(async () => {
  try {
    const adminUuid = 'be6476df-3400-11f1-8931-87bb173ff820';
    
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'gopi@gmail.com',
      password: '9123564780',
      role: 'member'
    });
    const token = loginRes.data.token;
    console.log('✅ Login successful! Token obtained');
    
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Step 2: Test plans API without filter
    console.log('\nStep 2: Testing /plans (no filter)...');
    const res1 = await api.get('/plans');
    console.log('✅ GET /api/plans returned:', res1.data.length, 'plans');
    
    // Step 3: Test plans API with filter
    console.log('\nStep 3: Testing /plans?created_by=... (with filter)...');
    const res2 = await api.get(`/plans?created_by=${adminUuid}`);
    console.log('✅ GET /api/plans?created_by=... returned:', res2.data.length, 'plans');
    
    if (res2.data.length > 0) {
      console.log('\nFirst plan details:');
      const p = res2.data[0];
      console.log('  - ID:', p.id);
      console.log('  - Plan ID:', p.plan_id);
      console.log('  - Name:', p.name);
      console.log('  - Price:', p.price);
      console.log('  - Created by:', p.created_by);
    } else {
      console.log('⚠️  No plans returned with filter!');
    }
    
  } catch(err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
