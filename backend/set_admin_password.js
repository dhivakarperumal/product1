const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // Set password for demo@gmail.com to 'password123' for testing
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'demo@gmail.com']
    );
    
    console.log('✓ Set demo@gmail.com password to: password123');
    
    // Also set password for gym_1@gmail.com
    const hashedPassword2 = await bcrypt.hash('password123', 10);
    await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword2, 'gym_1@gmail.com']
    );
    
    console.log('✓ Set gym_1@gmail.com password to: password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
