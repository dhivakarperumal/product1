const db = require('./src/config/db');

async function run() {
  try {
    console.log('Starting user_id backfill for memberships...');

    // Get all memberships with no userId
    const [membershipsNoUserId] = await db.query(
      `SELECT id, member_email, member_name FROM memberships WHERE userId IS NULL AND member_email IS NOT NULL AND member_email != ''`
    );

    console.log(`Found ${membershipsNoUserId.length} memberships without user_id`);

    let updated = 0;
    let failed = 0;
    
    for (const membership of membershipsNoUserId) {
      try {
        const [userRows] = await db.query(
          `SELECT id FROM users WHERE TRIM(email) = TRIM(?) LIMIT 1`,
          [membership.member_email]
        );

        if (userRows.length > 0) {
          const userId = userRows[0].id;
          await db.query(
            `UPDATE memberships SET userId = ? WHERE id = ?`,
            [userId, membership.id]
          );
          updated++;
          console.log(`✓ Membership ${membership.id}: linked to user ${userId} (${membership.member_email})`);
        } else {
          failed++;
          console.log(`✗ Membership ${membership.id}: no matching user found for email ${membership.member_email}`);
        }
      } catch (error) {
        failed++;
        console.error(`✗ Membership ${membership.id}: error during update:`, error.message);
      }
    }

    console.log(`\n=== BACKFILL COMPLETE ===`);
    console.log(`Total memberships without userId: ${membershipsNoUserId.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed to update: ${failed}`);

    process.exit(0);
  } catch (error) {
    console.error('Backfill error:', error);
    process.exit(1);
  }
}

run();
