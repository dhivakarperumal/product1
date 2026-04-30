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

async function fixNaveen() {
  const conn = await pool.getConnection();
  try {
    console.log('Fixing member Naveen without userId...\n');

    // Get Naveen's member record
    const [members] = await conn.query(
      'SELECT id, name, email FROM members WHERE name = ? OR email = ?',
      ['Naveen', 'naveen@gmail.com']
    );

    if (members.length === 0) {
      console.log('Member Naveen not found');
      return;
    }

    const member = members[0];
    console.log(`Found member: ${member.name} (id: ${member.id})`);

    // Check if user exists
    const [existingUsers] = await conn.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [member.email, 'naveen']
    );

    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`User already exists with id: ${userId}`);
    } else {
      // Get admin UUID from member's created_by field
      const [adminCheck] = await conn.query(
        'SELECT created_by FROM members WHERE id = ?',
        [member.id]
      );
      const adminUuid = adminCheck[0]?.created_by;
      
      // Create user account
      console.log('Creating user account for Naveen...');
      const crypto = require('crypto');
      const userUuid = crypto.randomUUID();
      
      const [result] = await conn.query(
        `INSERT INTO users (username, email, password_hash, role, user_uuid, admin_uuid, subscription_status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        ['naveen', member.email, 'member_no_password', 'member', userUuid, adminUuid, 'pending']
      );
      userId = result.insertId;
      console.log(`✓ Created user with id: ${userId}`);
    }

    // Update members table
    await conn.query(
      'UPDATE members SET user_id = ? WHERE id = ?',
      [userId, member.id]
    );
    console.log(`✓ Updated members table - user_id set to ${userId}`);

    // Update memberships table
    const [result] = await conn.query(
      'UPDATE memberships SET userId = ? WHERE memberId = ?',
      [userId, member.id]
    );
    console.log(`✓ Updated ${result.affectedRows} membership record(s) - userId set to ${userId}`);

    // Verify the fix
    const [updatedMemberships] = await conn.query(
      'SELECT id, userId, memberId, planName FROM memberships WHERE memberId = ?',
      [member.id]
    );
    console.log('\nVerification - Updated memberships:');
    console.log(JSON.stringify(updatedMemberships, null, 2));

    console.log('\n✅ Fix completed successfully!');
  } catch (error) {
    console.error('Error fixing Naveen:', error);
  } finally {
    await conn.release();
    await pool.end();
  }
}

fixNaveen();
