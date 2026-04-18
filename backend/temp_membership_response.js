const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/memberships/user/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (err) {
      console.log('RAW RESPONSE:', data);
    }
  });
});
req.on('error', (err) => {
  console.error('ERROR', err.message);
});
req.end();
