const http = require('http');
const jwt = require('jsonwebtoken');

// Create a mock JWT token as an admin
const mockAdminToken = jwt.sign(
  {
    userId: 1,
    adminUuid: '11111111-1111-1111-1111-111111111111',
    userUuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    role: 'admin',
    email: 'admin@test.com'
  },
  'test-secret',
  { expiresIn: '24h' }
);

console.log('Mock admin token created');
console.log('Making GET /api/assignments request with admin token...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/assignments',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${mockAdminToken}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const assignments = JSON.parse(data);
      console.log(`Response Status: ${res.statusCode}`);
      console.log(`Total assignments returned: ${Array.isArray(assignments) ? assignments.length : 'ERROR - not an array'}`);
      
      if (Array.isArray(assignments) && assignments.length > 0) {
        console.log(`\nSample assignments:`);
        assignments.slice(0, 3).forEach((a, i) => {
          console.log(`  [${i+1}] User: ${a.userId} (${a.username}), Plan: ${a.planId} (${a.planName}), Trainer: ${a.trainerId} (${a.trainerName})`);
        });
      } else if (assignments.error) {
        console.log(`Error: ${assignments.error}`);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
