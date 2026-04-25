const db = require('./src/config/db');

(async () => {
  try {
    console.log('Adding user_id column to members table...');
    
    // Check if column exists
    const [cols] = await db.query('SHOW COLUMNS FROM members LIKE "user_id"');
    
    if (cols.length === 0) {
      // Column doesn't exist, add it
      await db.query('ALTER TABLE members ADD COLUMN user_id INT NULL AFTER id');
      console.log('✓ Added user_id column');
      
      // Add index
      await db.query('ALTER TABLE members ADD INDEX idx_members_user_id (user_id)');
      console.log('✓ Added index on user_id');
    } else {
      console.log('• user_id column already exists');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
