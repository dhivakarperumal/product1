const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gym_user_db'
    });
    
    // Simulate getMembersIdentifierColumns
    const [rows] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND COLUMN_NAME IN ('email', 'username', 'mobile', 'phone')"
    );
    
    const availableColumns = rows.map(row => row.COLUMN_NAME);
    console.log('Available columns:', availableColumns);
    
    // Build search columns
    const searchColumns = ['email', 'username', 'mobile', 'phone'].filter(col => availableColumns.includes(col));
    console.log('Search columns:', searchColumns);
    
    // Build conditions
    const conditions = searchColumns.map(col => `${col} = ?`).join(' OR ');
    console.log('Conditions:', conditions);
    console.log('SQL:', 'SELECT * FROM members WHERE ' + conditions);
    
    // Now try the actual query
    const params = searchColumns.map(() => 'gopi@gmail.com');
    const [result] = await conn.query(`SELECT * FROM members WHERE ${conditions}`, params);
    console.log('\nQuery result:', result.length, 'rows found');
    
    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
})();
