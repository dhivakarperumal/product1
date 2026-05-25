require('dotenv').config();
const pool = require('./src/config/db');

async function testAdminFiltering() {
    try {
        console.log('Testing admin enquiry filtering...\n');
        
        // Simulate an admin user with the UUID we found
        const adminUuid = 'be6476df-3400-11f1-8931-87bb173ff820';
        const adminId = 'be6476df-3400-11f1-8931-87bb173ff820';  // Same as UUID in this case
        
        const getAdminFilterParams = (user) => {
            const adminUuid = user?.adminUuid || user?.admin_uuid || user?.userUuid || user?.user_uuid || null;
            const adminId = user?.userId || user?.user_id || user?.id || null;
            const params = [];
            if (adminUuid) params.push(adminUuid);
            if (adminId) params.push(adminId);
            return params;
        };

        const req = {
            user: {
                id: adminId,
                userId: adminId,
                adminUuid: adminUuid,
                role: 'admin'
            },
            query: {}
        };

        console.log('Step 1: Get admin filter params');
        const adminFilterParams = getAdminFilterParams(req.user);
        const adminUuidVal = adminFilterParams[0] || null;
        const adminIdVal = adminFilterParams[1] || null;
        console.log('  Admin UUID:', adminUuidVal);
        console.log('  Admin ID:', adminIdVal);

        console.log('\nStep 2: Build staff WHERE clause');
        const staffWhere = [];
        const staffParams = [];
        if (adminUuidVal) {
            staffWhere.push('admin_uuid = ?');
            staffParams.push(adminUuidVal);
        }
        
        console.log('  Staff WHERE clauses:', staffWhere);
        console.log('  Staff params:', staffParams);

        console.log('\nStep 3: Query staff table');
        let staffRows = [];
        if (staffWhere.length > 0) {
            const staffQuery = `SELECT employee_id, id, admin_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`;
            console.log('  Query:', staffQuery);
            console.log('  Params:', staffParams);
            const [rows] = await pool.query(staffQuery, staffParams);
            staffRows = rows;
            console.log('  Found', rows.length, 'staff members');
            rows.forEach((s, i) => {
                console.log(`    [${i}] id=${s.id}, employee_id=${s.employee_id}, admin_uuid=${s.admin_uuid}`);
            });
        }

        console.log('\nStep 4: Build enquiry filter');
        const createdByCandidates = [];
        if (adminUuidVal) createdByCandidates.push(adminUuidVal);
        if (adminIdVal) createdByCandidates.push(String(adminIdVal));

        for (const s of staffRows) {
            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
            if (s.id) createdByCandidates.push(String(s.id));
        }
        
        console.log('  Created by candidates:', createdByCandidates);
        console.log('  Total candidates:', createdByCandidates.length);

        console.log('\nStep 5: Build trainer candidates');
        const trainerCandidates = [];
        if (staffRows && staffRows.length > 0) {
            for (const s of staffRows) {
                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                if (s.id) trainerCandidates.push(String(s.id));
            }
        }
        console.log('  Trainer candidates:', trainerCandidates);

        console.log('\nStep 6: Build final WHERE clause');
        let whereClauses = [];
        let params = [];
        
        if (createdByCandidates.length > 0) {
            const createdPlaceholders = createdByCandidates.map(() => '?').join(',');
            let trainerClause = '';
            const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
            if (trainerPlaceholders) {
                trainerClause = ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})`;
            }

            whereClauses.push(`(enquiries.created_by IN (${createdPlaceholders})${trainerClause})`);
            params.push(...createdByCandidates);
            if (trainerCandidates.length > 0) params.push(...trainerCandidates);

            const whereClause = whereClauses[0];
            console.log('  WHERE clause:', whereClause);
            console.log('  Params:', params);
        }

        console.log('\nStep 7: Execute final enquiry query');
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

        let query = getEnquirySelectQuery();
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';

        console.log('  Full query:', query);
        console.log('  Params:', params);

        const [rows] = await pool.query(query, params);
        console.log('\n✓ Query succeeded!');
        console.log('  Found', rows.length, 'enquiries for admin');
        
        if (rows.length > 0) {
            rows.forEach((row, i) => {
                console.log(`  [${i}] ${row.name} (id=${row.id}, created_by=${row.created_by}, trainer_id=${row.trainer_id})`);
            });
        }

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testAdminFiltering();
