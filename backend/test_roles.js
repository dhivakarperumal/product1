const http = require('http');

async function testLogin(role, email, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      identifier: email,
      password: password,
      role: role
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ role, status: res.statusCode, result });
        } catch {
          resolve({ role, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => resolve({ role, error: err.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Testing role-based authentication...\n');
  
  const tests = [
    { role: 'super admin', email: 'superadmin@gym.com', password: 'password123' },
    { role: 'admin', email: 'admin@gym.com', password: 'password123' },
    { role: 'member', email: 'member@gym.com', password: 'password123' },
    { role: 'trainer', email: 'trainer@gym.com', password: 'password123' }
  ];

  for (const test of tests) {
    const result = await testLogin(test.role, test.email, test.password);
    console.log(`\n[${result.role.toUpperCase()}]:`);
    console.log('Status:', result.status);
    if (result.error) {
      console.log('Error:', result.error);
    } else if (result.result?.message) {
      console.log('Message:', result.result.message);
      if (result.result.role) console.log('Authenticated as:', result.result.role);
    } else if (result.result?.token) {
      console.log('✅ Login successful');
      console.log('Token:', result.result.token.substring(0, 20) + '...');
    } else {
      console.log('Response:', result.result || result.body);
    }
  }
  
  process.exit(0);
})();
