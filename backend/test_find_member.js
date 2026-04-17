const pool = require('./src/config/db');

let membersIdentifierColumnsCache = null;

async function getMembersIdentifierColumns() {
  if (membersIdentifierColumnsCache) {
    console.log('[TEST] Using cached columns:', membersIdentifierColumnsCache);
    return membersIdentifierColumnsCache;
  }

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'members'
       AND COLUMN_NAME IN ('email', 'username', 'mobile', 'phone')`
  );

  console.log('[TEST] Database returned columns:', rows.map(r => r.COLUMN_NAME));
  membersIdentifierColumnsCache = rows.map((row) => row.COLUMN_NAME);
  return membersIdentifierColumnsCache;
}

async function findMemberByIdentifier(identifier) {
  try {
    console.log('[DEBUG] findMemberByIdentifier called with:', identifier);
    const availableColumns = await getMembersIdentifierColumns();
    console.log('[DEBUG] Available columns:', availableColumns);
    
    const searchColumns = ['email', 'username', 'mobile', 'phone'].filter((column) =>
      availableColumns.includes(column)
    );
    console.log('[DEBUG] Search columns after filter:', searchColumns);

    if (searchColumns.length === 0) {
      throw new Error(
        'Members table does not expose a supported identifier column. Add email, phone, username or mobile to the members schema.'
      );
    }

    const conditions = searchColumns.map((column) => `${column} = ?`).join(' OR ');
    const params = searchColumns.map(() => identifier);
    
    console.log('[DEBUG] Building SQL:', `SELECT * FROM members WHERE ${conditions}`);
    console.log('[DEBUG] With params:', params);
    
    const [rows] = await pool.query(`SELECT * FROM members WHERE ${conditions}`, params);

    console.log('[DEBUG] Query succeeded! Found', rows.length, 'rows');
    return rows[0] || null;
  } catch (err) {
    console.error('[DEBUG] findMemberByIdentifier error:', err.message);
    console.error('[DEBUG] Error code:', err.code);
    console.error('[DEBUG] Error stack:', err.stack);
    throw err;
  }
}

(async () => {
  try {
    const result = await findMemberByIdentifier('gopi@gmail.com');
    console.log('\nSUCCESS! Found member:', result ? result.name : 'NOT FOUND');
    process.exit(0);
  } catch (err) {
    console.error('\nFAILED!');
    process.exit(1);
  }
})();
