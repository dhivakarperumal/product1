const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let membersIdentifierColumnsCache = null;

function buildAuthPayload(user) {
  const adminUuid = user.admin_uuid || user.user_uuid || user.userUuid || user.created_by || null;
  const contact = user.mobile || user.phone || null;
  
  return {
    userId: user.id || null,
    user_id: user.user_id || null,
    userUuid: user.user_uuid || user.userUuid || null,
    role: user.role,
    email: user.email,
    username: user.username || null,
    mobile: user.mobile || contact,
    phone: user.phone || contact,
    adminId: user.admin_id || null,
    adminUuid: adminUuid,
    subscriptionStatus: user.subscription_status || null,
  };
}

async function getMembersIdentifierColumns() {
  if (membersIdentifierColumnsCache) {
    return membersIdentifierColumnsCache;
  }

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'members'
       AND COLUMN_NAME IN ('email', 'username', 'mobile', 'phone')`
  );

  membersIdentifierColumnsCache = rows.map((row) => row.COLUMN_NAME);
  return membersIdentifierColumnsCache;
}

async function findMemberByIdentifier(identifier) {
  try {
    console.log('[TEST] findMemberByIdentifier called with:', identifier);
    const availableColumns = await getMembersIdentifierColumns();
    const searchColumns = ['email', 'username', 'mobile', 'phone'].filter((column) =>
      availableColumns.includes(column)
    );

    if (searchColumns.length === 0) {
      throw new Error(
        'Members table does not expose a supported identifier column. Add email, phone, username or mobile to the members schema.'
      );
    }

    const conditions = searchColumns.map((column) => `${column} = ?`).join(' OR ');
    const params = searchColumns.map(() => identifier);
    const [rows] = await pool.query(`SELECT * FROM members WHERE ${conditions}`, params);

    console.log('[TEST] Found', rows.length, 'rows');
    return rows[0] || null;
  } catch (err) {
    console.error('[TEST] findMemberByIdentifier error:', err.message);
    throw err;
  }
}

async function findMemberAuthByIdentifier(identifier) {
  try {
    console.log('[TEST] findMemberAuthByIdentifier called with:', identifier);
    const [rows] = await pool.query(
      'SELECT * FROM members_auth WHERE email = ? OR username = ? OR mobile = ? LIMIT 1',
      [identifier, identifier, identifier]
    );
    console.log('[TEST] Found', rows.length, 'rows in members_auth');
    return rows[0] || null;
  } catch (err) {
    console.error('[TEST] findMemberAuthByIdentifier error:', err.message);
    throw err;
  }
}

async function testLogin() {
  const identifier = 'gopi@gmail.com';
  const password = '9123564780';
  const role = 'member';

  console.log('[TEST] Starting login test for:', identifier, 'as', role);
  
  try {
    // Step 1: Find member
    console.log('\n[STEP 1] Calling findMemberByIdentifier...');
    let user = await findMemberByIdentifier(identifier);
    let table = 'members';
    
    if (!user) {
      console.log('[STEP 1] Member not found, trying members_auth fallback...');
      const legacyMember = await findMemberAuthByIdentifier(identifier);
      if (legacyMember) {
        user = legacyMember;
        table = 'members_auth';
      }
    }

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found in table:', table);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Phone:', user.phone);
    console.log('   Has password_hash:', !!user.password_hash);

    // Step 2: Get password
    console.log('\n[STEP 2] Checking password...');
    let storedPassword = user.password_hash || user.password;
    if (!storedPassword && table === 'members' && user.phone) {
      console.log('   Using phone as fallback password');
      storedPassword = String(user.phone);
    }

    if (!storedPassword) {
      console.log('❌ No password found');
      return;
    }

    console.log('✅ Password retrieved');

    // Step 3: Compare password
    console.log('\n[STEP 3] Comparing password...');
    let match = false;
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
      console.log('   Using bcrypt.compare (hashed password)');
      match = await bcrypt.compare(password, storedPassword);
    } else {
      console.log('   Using plain text comparison');
      match = password === storedPassword;
    }

    if (!match) {
      console.log('❌ Password mismatch');
      return;
    }

    console.log('✅ Password matches');

    // Step 4: Build payload
    console.log('\n[STEP 4] Building auth payload...');
    const payload = buildAuthPayload(user);
    console.log('✅ Payload built');

    // Step 5: Create JWT token
    console.log('\n[STEP 5] Creating JWT token...');
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    console.log('✅ Token created');

    console.log('\n✅✅✅ LOGIN SUCCESS ✅✅✅');
    console.log('Token:', token.substring(0, 50) + '...');

  } catch (err) {
    console.error('\n❌ LOGIN FAILED');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    process.exit(0);
  }
}

testLogin();
