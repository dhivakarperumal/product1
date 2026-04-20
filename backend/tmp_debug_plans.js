const axios = require('axios');

(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'gopi@gmail.com',
      password: '9123564780',
      role: 'member'
    });
    const token = loginRes.data.token;
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { Authorization: `Bearer ${token}` }
    });

    const res1 = await api.get('/plans');
    console.log('GET /api/plans count', res1.data.length);
    console.log('samples', res1.data.slice(0,3));

    const res2 = await api.get('/plans?created_by=be6476df-3400-11f1-8931-87bb173ff820');
    console.log('GET /api/plans?created_by count', res2.data.length);
    console.log('samples', res2.data.slice(0,3));
  } catch (err) {
    console.error('ERROR', err.toString());
    if (err.response) {
      console.error('STATUS', err.response.status);
      console.error('DATA', JSON.stringify(err.response.data, null, 2));
    }
  }
})();
