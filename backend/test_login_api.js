const axios = require('axios');

(async () => {
  try {
    console.log('Sending login request to http://localhost:5000/api/auth/login');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'gopi@gmail.com',
      password: '9123564780',
      role: 'member'
    });
    console.log('\n✅ Login successful!');
    console.log('Token:', response.data.token.substring(0, 50) + '...');
    console.log('User:', JSON.stringify(response.data.user, null, 2));
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.log('\n❌ Login failed!');
      console.log('Status:', err.response.status);
      console.log('Error:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Request failed:', err.message);
    }
    process.exit(1);
  }
})();
