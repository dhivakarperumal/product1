const db = require('./src/config/db');

(async () => {
  try {
    // Delete the failed migration entry
    await db.query('DELETE FROM schema_migrations WHERE filename = ?', ['0043_change_created_updated_by_to_uuid.sql']);
    console.log('Migration entry removed, will retry on next startup');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
