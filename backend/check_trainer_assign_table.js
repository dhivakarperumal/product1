const db = require('./src/config/db');

async function run() {
  try {
    console.log('=== CHECKING TRAINER_ASSIGNMENTS TABLE ===\n');

    // Get table structure
    const [structure] = await db.query('DESCRIBE trainer_assignments');
    
    console.log('TABLE COLUMNS:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    // Get sample row
    console.log('\n=== SAMPLE DATA ===\n');
    const [rows] = await db.query('SELECT * FROM trainer_assignments LIMIT 3');
    
    if (rows.length > 0) {
      console.log('Keys in first row:', Object.keys(rows[0]));
      console.log('\nFirst row data:');
      console.log(JSON.stringify(rows[0], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

run();
