require('dotenv').config();
const pool = require('./src/config/db');

async function testEnquiryFetch() {
    try {
        console.log('Testing enquiry fetch...');
        
        // Simulate an admin user
        const req = {
            user: {
                id: 'be6476df-3400-11f1-8931-87bb173ff820',
                userId: 'be6476df-3400-11f1-8931-87bb173ff820',
                adminUuid: 'be6476df-3400-11f1-8931-87bb173ff820',
                role: 'admin'
            },
            query: {}
        };

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

        const getAdminFilterParams = (user) => {
            const adminUuid = user?.adminUuid || user?.admin_uuid || user?.userUuid || user?.user_uuid || null;
            const adminId = user?.userId || user?.user_id || user?.id || null;
            const params = [];
            if (adminUuid) params.push(adminUuid);
            if (adminId) params.push(adminId);
            return params;
        };

        const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
        const userRole = req.user && String(req.user.role || '').toLowerCase();
        const { created_by } = req.query;

        let query = getEnquirySelectQuery();
        let params = [];
        let whereClauses = [];

        if (isSuperAdmin && created_by) {
            whereClauses.push('enquiries.created_by = ?');
            params.push(created_by);
        } else if (!isSuperAdmin && req.user) {
            if (userRole === 'trainer') {
                console.log('User is trainer');
            } else if (userRole === 'admin') {
                console.log('User is admin, fetching admin filter params...');
                const adminFilterParams = getAdminFilterParams(req.user);
                let adminUuid = adminFilterParams[0] || null;
                let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                console.log('Admin UUID:', adminUuid);
                console.log('Admin ID:', adminId);

                const staffWhere = [];
                const staffParams = [];
                if (adminUuid) {
                    staffWhere.push('admin_uuid = ?');
                    staffParams.push(adminUuid);
                }
                if (adminId) {
                    staffWhere.push('admin_id = ?');
                    staffParams.push(adminId);
                }

                const createdByCandidates = [];
                if (adminUuid) createdByCandidates.push(adminUuid);
                if (adminId) createdByCandidates.push(String(adminId));

                let staffRows = [];
                if (staffWhere.length > 0) {
                    console.log('Fetching staff with query:', `SELECT employee_id, id, user_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`);
                    const [rows] = await pool.query(`SELECT employee_id, id, user_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                    staffRows = rows;
                    console.log('Found staff rows:', staffRows.length);
                    for (const s of staffRows) {
                        if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                        if (s.user_uuid) createdByCandidates.push(String(s.user_uuid));
                        if (s.id) createdByCandidates.push(String(s.id));
                    }
                }

                console.log('Created by candidates:', createdByCandidates);

                if (createdByCandidates.length > 0) {
                    const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                    const trainerCandidates = [];
                    if (staffRows && staffRows.length > 0) {
                        for (const s of staffRows) {
                            if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                            if (s.user_uuid) trainerCandidates.push(String(s.user_uuid));
                            if (s.id) trainerCandidates.push(String(s.id));
                        }
                    }

                    console.log('Trainer candidates:', trainerCandidates);

                    let trainerClause = '';
                    const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                    if (trainerPlaceholders) {
                        trainerClause = ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})`;
                    }

                    whereClauses.push(`(enquiries.created_by IN (${createdPlaceholders})${trainerClause})`);
                    params.push(...createdByCandidates);
                    if (trainerCandidates.length > 0) params.push(...trainerCandidates);
                }
            }
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        console.log('Final query:', query);
        console.log('Final params:', params);

        const [rows] = await pool.query(query, params);
        console.log('Results:', rows.length, 'enquiries found');
        console.log('First result:', rows[0]);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testEnquiryFetch();
