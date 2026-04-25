const db = require('./src/config/db');

async function run() {
  try {
    console.log('Starting user_id population for existing members...');

    // Determine which table to use
    const [memberRows] = await db.query("SHOW TABLES LIKE 'members'");
    const [gymRows] = await db.query("SHOW TABLES LIKE 'gym_members'");
    
    let memberTable = 'members';
    if (gymRows.length > 0) {
      const [cols] = await db.query("SHOW COLUMNS FROM gym_members LIKE 'member_id'");
      if (cols.length > 0) {
        memberTable = 'gym_members';
      }
    }

    console.log(`Using table: ${memberTable}`);

    // Get all members with no user_id
    const [membersNoUserId] = await db.query(
      `SELECT id, email, phone FROM ${memberTable} WHERE user_id IS NULL AND (email IS NOT NULL OR phone IS NOT NULL)`
    );

    console.log(`Found ${membersNoUserId.length} members without user_id`);

    let updated = 0;
    for (const member of membersNoUserId) {
      const [userRows] = await db.query(
        `SELECT id FROM users WHERE 
         (TRIM(email) = TRIM(?) AND email IS NOT NULL AND email != '') OR 
         (TRIM(mobile) = TRIM(?) AND mobile IS NOT NULL AND mobile != '')
         LIMIT 1`,
        [member.email || '', member.phone || '']
      );

      if (userRows.length > 0) {
        const userId = userRows[0].id;
        await db.query(
          `UPDATE ${memberTable} SET user_id = ? WHERE id = ?`,
          [userId, member.id]
        );
        updated++;
        console.log(`✓ Member ${member.id}: linked to user ${userId}`);
      } else {
        console.log(`✗ Member ${member.id}: no matching user found (email: ${member.email}, phone: ${member.phone})`);
      }
    }

    console.log(`\n✅ Populated user_id for ${updated} members`);

    if (membersNoUserId.length - updated > 0) {
      console.log(`⚠️  ${membersNoUserId.length - updated} members still have no matching user`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
