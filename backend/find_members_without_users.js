require('dotenv').config({ path: 'env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gym_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function findMembersWithoutUsers() {
  const conn = await pool.getConnection();
  try {
    console.log('Finding all members without valid user IDs...\n');

    // Find all memberships without valid userId
    const [memberships] = await conn.query(`
      SELECT DISTINCT m.id, m.memberId, gm.name, gm.email
      FROM memberships m
      LEFT JOIN members gm ON m.memberId = gm.id
      WHERE m.userId IS NULL OR m.userId = 0
      ORDER BY gm.name
    `);

    console.log(`Found ${memberships.length} membership record(s) without valid userId:\n`);
    
    if (memberships.length === 0) {
      console.log('✅ No issues found! All members have valid user IDs.');
      return;
    }

    memberships.forEach((m, index) => {
      console.log(`${index + 1}. Member: ${m.name} (${m.email}) - Membership ID: ${m.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.release();
    await pool.end();
  }
}

findMembersWithoutUsers();
