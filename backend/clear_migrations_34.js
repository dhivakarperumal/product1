const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gym_user_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await pool.getConnection();
    
    // Delete migration records from 0034 onwards
    const [result] = await conn.query('DELETE FROM applied_migrations WHERE migration_name >= ?', ['0034']);
    console.log('✅ Cleared ' + result.affectedRows + ' migration records from 0034 onwards');
    
    conn.release();
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
