require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
  try {
    const [columns] = await db.query('DESCRIBE gym_members');
    const columnNames = columns.map(c => c.Field.toLowerCase());

    if (!columnNames.includes('height')) {
      console.log('Adding height column...');
      await db.query('ALTER TABLE gym_members ADD COLUMN height DECIMAL(5,2) DEFAULT NULL AFTER gender');
    }
    if (!columnNames.includes('weight')) {
      console.log('Adding weight column...');
      await db.query('ALTER TABLE gym_members ADD COLUMN weight DECIMAL(5,2) DEFAULT NULL AFTER height');
    }
    if (!columnNames.includes('bmi')) {
      console.log('Adding bmi column...');
      await db.query('ALTER TABLE gym_members ADD COLUMN bmi DECIMAL(5,2) DEFAULT NULL AFTER weight');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
