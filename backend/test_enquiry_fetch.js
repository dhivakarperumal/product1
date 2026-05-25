require('dotenv').config();
const pool = require('./src/config/db');

async function testEnquiryFetch() {
    try {
        console.log('Testing enquiry fetch with correct schema...');
        
        // Simulate an admin user
        const adminUuid = 'be6476df-3400-11f1-8931-87bb173ff820';
        
        const getEnquirySelectQuery = () =>
            `SELECT enquiries.*,
                            COALESCE(staff.username, staff.name, staff.email, enquiries.trainer_id) AS trainer_display_name,
                            staff.username AS trainer_username,
                            staff.name AS trainer_name,
                            staff.email AS trainer_email,
                            COALESCE(staff.employee_id, enquiries.trainer_id) AS trainer_employee_id,
                            staff.id AS trainer_numeric_id,
                            enquiries.trainer_id AS raw_trainer_id
             FROM enquiries
             LEFT JOIN staff ON (
                 CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
                 OR CAST(enquiries.trainer_id AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(staff.id AS CHAR) COLLATE utf8mb4_unicode_ci
             )`;

        // First check if there are any enquiries at all
        console.log('\n1. Checking total enquiries...');
        const [allEnquiries] = await pool.query('SELECT COUNT(*) as count FROM enquiries');
        console.log('Total enquiries in DB:', allEnquiries[0].count);

        // Check enquiries table structure
        console.log('\n2. Checking enquiries table schema...');
        const [enquiryCols] = await pool.query('DESCRIBE enquiries');
        const enquiryFields = enquiryCols.map(c => c.Field);
        console.log('Enquiries fields:', enquiryFields.join(', '));

        // Check if created_by column exists
        if (enquiryFields.includes('created_by')) {
            console.log('✓ created_by column exists');
            const [createdByValues] = await pool.query('SELECT DISTINCT created_by FROM enquiries LIMIT 5');
            console.log('Sample created_by values:', createdByValues.map(r => r.created_by));
        } else {
            console.log('✗ created_by column MISSING!');
        }

        // Check if trainer_id column exists
        if (enquiryFields.includes('trainer_id')) {
            console.log('✓ trainer_id column exists');
        } else {
            console.log('✗ trainer_id column MISSING!');
        }

        // Now test the actual query
        console.log('\n3. Testing main enquiry query...');
        let query = getEnquirySelectQuery();
        let params = [];
        
        // For admin user - no WHERE clause to see if query itself works
        query += ' ORDER BY created_at DESC LIMIT 5';
        
        console.log('Query:', query);
        console.log('Params:', params);
        
        const [rows] = await pool.query(query, params);
        console.log('\n✓ Query succeeded!');
        console.log('Found', rows.length, 'enquiries');
        if (rows.length > 0) {
            console.log('\nFirst enquiry sample:');
            const first = rows[0];
            console.log('  - id:', first.id);
            console.log('  - name:', first.name);
            console.log('  - created_by:', first.created_by);
            console.log('  - trainer_id:', first.trainer_id);
            console.log('  - trainer_display_name:', first.trainer_display_name);
        }

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testEnquiryFetch();
