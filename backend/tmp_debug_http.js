const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'gopi@gmail.com',
      password: '9123564780',
      role: 'member'
    });
    console.log('ok', res.data);
  } catch (err) {
    console.error('ERROR', err.toString());
    if (err.response) {
      console.error('STATUS', err.response.status);
      console.error('DATA', JSON.stringify(err.response.data, null, 2));
    }
    if (err.request) {
      console.error('REQUEST', err.request._header || err.request.res || err.request);
    }
  }
})();
