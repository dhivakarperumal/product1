require('dotenv').config();
const db = require('./src/config/db');

async function checkSchema() {
  try {
    const [columns] = await db.query('DESCRIBE branches');
    console.log(JSON.stringify(columns, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
