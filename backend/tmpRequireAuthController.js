
try {
  require('./src/controllers/authController');
  console.log('OK');
} catch (err) {
  console.error('ERR', err && err.stack ? err.stack : err);
  process.exit(1);
}
