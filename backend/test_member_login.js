const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, result });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  console.log('Testing Member Login Flow...\n');
  
  const loginData = {
    identifier: 'member@gym.com',
    password: 'password123',
    role: 'member'
  };
  
  console.log('Request:', JSON.stringify(loginData, null, 2));
  
  const response = await makeRequest('/api/auth/login', loginData);
  console.log('\nResponse Status:', response.status);
  console.log('Response Body:', JSON.stringify(response.result || response.body, null, 2));
  
  if (response.status === 200) {
    console.log('\n✅ SUCCESS');
  } else if (response.status === 400) {
    console.log('\n❌ Invalid credentials or bad request');
  } else if (response.status === 403) {
    console.log('\n❌ Forbidden (authorization issue)');
  } else {
    console.log('\n❌ Unexpected status:', response.status);
  }
  
  process.exit(0);
})();
