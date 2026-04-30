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

async function checkNaveen() {
  const conn = await pool.getConnection();
  try {
    console.log('Checking member Naveen...\n');

    // Find Naveen in members table
    const [members] = await conn.query(
      'SELECT * FROM members WHERE name LIKE ? OR email LIKE ?',
      ['%Naveen%', '%naveen%']
    );
    
    console.log('Members table - Naveen records:');
    console.log(JSON.stringify(members, null, 2));

    if (members.length > 0) {
      for (const member of members) {
        console.log(`\n\nMemberships for member ${member.name} (id: ${member.id}):`);
        const [memberships] = await conn.query(
          'SELECT id, userId, memberId, planId, planName, trainerId, trainerName, trainerEmployeeId, createdAt FROM memberships WHERE memberId = ?',
          [member.id]
        );
        console.log(JSON.stringify(memberships, null, 2));

        // Check if corresponding user records exist
        for (const membership of memberships) {
          if (membership.userId) {
            const [user] = await conn.query(
              'SELECT * FROM users WHERE id = ?',
              [membership.userId]
            );
            console.log(`\nUser record for userId ${membership.userId}:`, user.length > 0 ? user[0] : 'NOT FOUND');
          } else {
            console.log(`\nMembership ${membership.id} has NULL userId`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.release();
    await pool.end();
  }
}

checkNaveen();
