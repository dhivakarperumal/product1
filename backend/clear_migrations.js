require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  try {
    // Clear all migrations from 0034 onwards
    const result = await db.query('DELETE FROM schema_migrations WHERE filename >= ?', ['0034_add_member_weight_to_diet_plans.sql']);
    console.log('Cleared migrations from 0034 onwards');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
