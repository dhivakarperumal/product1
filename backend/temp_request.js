const fetch = global.fetch || require('node-fetch');
(async () => {
  const urls = [
    'http://localhost:5000/api/members',
    'http://localhost:5000/api/memberships/today',
    'http://localhost:5000/api/memberships/alerts/expiring-soon'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('URL:', url, 'status:', res.status);
      console.log(text);
    } catch (err) {
      console.error('ERROR', url, err.message);
    }
    console.log('---');
  }
})();
