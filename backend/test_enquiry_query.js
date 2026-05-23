const mysql = require('mysql2/promise');

async function checkEnquiryData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gym_user_db'
  });

  try {
    // Get all enquiries with trainer info - using COLLATE to fix collation mismatch
    const [rows] = await conn.query(`
      SELECT enquiries.*, 
              COALESCE(staff.username, staff.name, staff.email) AS trainer_display_name,
              staff.username AS trainer_username,
              staff.name AS trainer_name,
              staff.email AS trainer_email,
              staff.employee_id AS trainer_employee_id
       FROM enquiries
       LEFT JOIN staff ON (CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci OR 
                           CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.id AS CHAR) COLLATE utf8mb4_unicode_ci OR
                           CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci OR
                           CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.id AS CHAR) COLLATE utf8mb4_unicode_ci)
      ORDER BY enquiries.created_at DESC
      LIMIT 3
    `);

    console.log('✅ Enquiry data query successful');
    console.log('Total enquiries with trainer join:', rows.length);
    if (rows.length > 0) {
      console.log('\nFirst enquiry:');
      console.log(JSON.stringify(rows[0], null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await conn.end();
  }
}

checkEnquiryData();
