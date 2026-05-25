const pool = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// NOTE: use getActorUuid(req.user) from utils/auditTrail for actor UUID

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

const isNumeric = (value) =>
  typeof value === 'number' || (/^\d+$/.test(String(value || '').trim()));

const getAdminFilterParams = (user) => {
    const adminUuid = getActorUuid(user);
  const adminId = user?.userId || user?.user_id || user?.id || null;
  const params = [];
  if (adminUuid) params.push(adminUuid);
  if (adminId) params.push(adminId);
  return params;
};

// Get the correct UUID for created_by/updated_by based on user role
const getCreatedByUuid = (user) => {
  if (!user) return null;
  
  const userRole = String(user.role || '').toLowerCase();
  
  // For trainers: use their employee_id (stored in userUuid/user_uuid/employee_id)
  if (userRole === 'trainer') {
    return user.userUuid || user.user_uuid || user.employee_id || user.employeeId || null;
  }
  
  // For admins and others: use their admin UUID
  return user.adminUuid || user.admin_uuid || user.userUuid || user.user_uuid || null;
};

async function normalizePlanId(planId) {
  if (!planId) return null;
  const requested = String(planId).trim();
  if (isNumeric(requested)) {
    const [planRows] = await pool.query(
      'SELECT plan_id FROM gym_plans WHERE id = ? LIMIT 1',
      [requested]
    );
    if (planRows.length > 0 && planRows[0].plan_id) {
      return planRows[0].plan_id;
    }
  }
  return requested;
}

async function normalizeTrainerId(trainerId) {
  if (!trainerId) return null;
  const requested = String(trainerId).trim();
  if (isNumeric(requested)) {
    const [staffRows] = await pool.query(
      'SELECT employee_id FROM staff WHERE id = ? LIMIT 1',
      [requested]
    );
    if (staffRows.length > 0 && staffRows[0].employee_id) {
      return staffRows[0].employee_id;
    }
  }
  return requested;
}

const enquiryController = {
    // Get all enquiries - filtered by trainer or admin if not a super admin
    getAllEnquiries: async (req, res) => {
        try {
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            const { created_by } = req.query;

            let query = getEnquirySelectQuery();
            let params = [];
            let whereClauses = [];

            // If super admin passes created_by query param, filter by that admin
            if (isSuperAdmin && created_by) {
                whereClauses.push('enquiries.created_by = ?');
                params.push(created_by);
            } else if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    // For trainers: show enquiries for their admin AND enquiries assigned to that trainer
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;

                    // Query to get trainer's admin_uuid and employee_id
                    let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                    let trainerParams = [];
                    if (trainerUuid && trainerId) {
                        trainerStaffQuery += '(employee_id = ? OR id = ?)';
                        trainerParams = [trainerUuid, trainerId];
                    } else if (trainerUuid) {
                        trainerStaffQuery += 'employee_id = ?';
                        trainerParams = [trainerUuid];
                    } else if (trainerId) {
                        trainerStaffQuery += 'id = ?';
                        trainerParams = [trainerId];
                    }

                    if (trainerParams.length > 0) {
                        const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                        if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                            // Allow enquiries created by the admin OR assigned to this trainer
                            const adminUuid = staffRows[0].admin_uuid;
                            const empId = staffRows[0].employee_id || staffRows[0].id;
                            whereClauses.push('(enquiries.created_by = ? OR CAST(enquiries.trainer_id AS CHAR) = ? OR CAST(enquiries.trainer_id AS CHAR) = ?)');
                            params.push(adminUuid, empId, String(staffRows[0].id));
                        }
                    }
                } else if (userRole === 'admin') {
                    // Regular admins should see enquiries created by them OR created by any trainer belonging to their admin
                    const adminFilterParams = getAdminFilterParams(req.user);
                    let adminUuid = adminFilterParams[0] || null;
                    let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                    // gather staff (trainers) under this admin to include their created_by values
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
                        const [rows] = await pool.query(`SELECT employee_id, id, admin_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                        staffRows = rows;
                        for (const s of staffRows) {
                            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                            if (s.id) createdByCandidates.push(String(s.id));
                        }
                    }

                    if (createdByCandidates.length > 0) {
                        // build placeholders for created_by
                        const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                        // Also include enquiries assigned to trainers under this admin by checking trainer_id
                        // collect trainer identifiers (employee_id, id) from staffRows
                        const trainerCandidates = [];
                        if (staffRows && staffRows.length > 0) {
                            for (const s of staffRows) {
                                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                                if (s.id) trainerCandidates.push(String(s.id));
                            }
                        }

                        // build placeholders for trainer_id values if any
                        let trainerClause = '';
                        const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                        if (trainerPlaceholders) {
                            // Match trainer_id (as stored strings) against known trainer identifiers
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

            // Debug: log query and params to help diagnose server errors
            try {
                console.debug('Enquiries SQL:', query);
                console.debug('Enquiries params:', params);
            } catch (logErr) {
                // ignore logging errors
            }

            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching enquiries:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    },

    // Get enquiry by ID
    getEnquiryById: async (req, res) => {
        try {
            const { id } = req.params;
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            
            let query = `${getEnquirySelectQuery()} WHERE enquiries.id = ?`;
            let params = [id];
            let authClauses = [];
            
            // Add authorization check for regular admins and trainers
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    // For trainers: allow access to enquiries created by their admin OR assigned to this trainer
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;

                    let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                    let trainerParams = [];
                    if (trainerUuid && trainerId) {
                        trainerStaffQuery += '(employee_id = ? OR id = ?)';
                        trainerParams = [trainerUuid, trainerId];
                    } else if (trainerUuid) {
                        trainerStaffQuery += 'employee_id = ?';
                        trainerParams = [trainerUuid];
                    } else if (trainerId) {
                        trainerStaffQuery += 'id = ?';
                        trainerParams = [trainerId];
                    }

                    if (trainerParams.length > 0) {
                        const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                        if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                            const adminUuid = staffRows[0].admin_uuid;
                            const empId = staffRows[0].employee_id || staffRows[0].id;
                            authClauses.push('(enquiries.created_by = ? OR CAST(enquiries.trainer_id AS CHAR) = ? OR CAST(enquiries.trainer_id AS CHAR) = ?)');
                            params.push(adminUuid, empId, String(staffRows[0].id));
                        }
                    }
                } else if (userRole === 'admin') {
                    // Regular admins: allow viewing enquiries created by them OR by trainers under their admin
                    const adminFilterParams = getAdminFilterParams(req.user);
                    let adminUuid = adminFilterParams[0] || null;
                    let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                    const createdByCandidates = [];
                    if (adminUuid) createdByCandidates.push(adminUuid);
                    if (adminId) createdByCandidates.push(String(adminId));

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

                    let staffRows = [];
                    if (staffWhere.length > 0) {
                        const [rows] = await pool.query(`SELECT employee_id, id, admin_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                        staffRows = rows;
                        for (const s of staffRows) {
                            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                            if (s.id) createdByCandidates.push(String(s.id));
                        }
                    }

                    if (createdByCandidates.length > 0) {
                        const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                        // also include enquiries assigned to trainers under this admin
                        const trainerCandidates = [];
                        if (staffRows && staffRows.length > 0) {
                            for (const s of staffRows) {
                                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                                if (s.id) trainerCandidates.push(String(s.id));
                            }
                        }

                        const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                        const trainerClause = trainerPlaceholders ? ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})` : '';

                        authClauses.push(`(enquiries.created_by IN (${createdPlaceholders})${trainerClause})`);
                        params.push(...createdByCandidates);
                        if (trainerCandidates.length > 0) params.push(...trainerCandidates);
                    }
                }
            }
            
            if (authClauses.length > 0) {
                query += ' AND ' + authClauses.join(' AND ');
            }
            
            const [rows] = await pool.query(query, params);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Create new enquiry
    createEnquiry: async (req, res) => {
        try {
            const { name, email, phone, subject, message, location, height, weight, bmi, status, planId, trainerId } = req.body;
            const plan_id = await normalizePlanId(planId || req.body.plan_id || null);
            let trainer_id = await normalizeTrainerId(
                trainerId || req.body.trainer_id ||
                ((req.user && String(req.user.role || '').toLowerCase() === 'trainer')
                    ? req.user.userUuid || req.user.employee_id || req.user.employeeId || req.user.id || req.user.userId || req.user.user_id
                    : null)
            );
            const enquiryStatus = status || 'pending';

            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Name, email, and message are required' });
            }

            // Determine admin scope and created_by value. If a trainer is creating the enquiry,
            // store the trainer's admin_uuid in `created_by` so admins can see trainer-created enquiries.
            let createdByUuid = getCreatedByUuid(req.user) || null;
            let adminParams = getAdminFilterParams(req.user);
            let hasAdminFilter = adminParams.length > 0;

            if (req.user && String(req.user.role || '').toLowerCase() === 'trainer') {
                const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                const trainerIdNum = req.user.id || req.user.userId || req.user.user_id || null;
                let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                let trainerParams = [];
                if (trainerUuid && trainerIdNum) {
                    trainerStaffQuery += '(employee_id = ? OR id = ?)';
                    trainerParams = [trainerUuid, trainerIdNum];
                } else if (trainerUuid) {
                    trainerStaffQuery += 'employee_id = ?';
                    trainerParams = [trainerUuid];
                } else if (trainerIdNum) {
                    trainerStaffQuery += 'id = ?';
                    trainerParams = [trainerIdNum];
                }

                if (trainerParams.length > 0) {
                    const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                    if (staffRows.length > 0) {
                        const staffRow = staffRows[0];
                        if (staffRow.admin_uuid) {
                            createdByUuid = staffRow.admin_uuid; // store admin_uuid so admin can see it
                            adminParams = [staffRow.admin_uuid];
                            hasAdminFilter = true;
                        }
                        // If trainer_id not explicitly provided, set it to the trainer's employee_id
                        if (!trainer_id && (staffRow.employee_id || staffRow.id)) {
                            trainer_id = await normalizeTrainerId(staffRow.employee_id || staffRow.id);
                        }
                    }
                }
            }

            // Check for duplicate phone/email within the same admin user
            if (phone && hasAdminFilter) {
                const [existingPhone] = await pool.query(
                    `SELECT * FROM enquiries WHERE phone = ? AND ${adminParams.length === 2 ? '(created_by = ? OR created_by = ?)' : 'created_by = ?'}`,
                    [phone, ...adminParams]
                );
                if (existingPhone.length > 0) {
                    return res.status(400).json({ error: 'Phone already exists for this admin' });
                }
            }

            if (email && hasAdminFilter) {
                const [existingEmail] = await pool.query(
                    `SELECT * FROM enquiries WHERE email = ? AND ${adminParams.length === 2 ? '(created_by = ? OR created_by = ?)' : 'created_by = ?'}`,
                    [email, ...adminParams]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ error: 'Email already exists for this admin' });
                }
            }

            const numHeight = height != null && !isNaN(height) ? Number(height) : null;
            const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
            const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;

            const [result] = await pool.query(
                'INSERT INTO enquiries (name, email, phone, subject, message, location, height, weight, bmi, status, plan_id, trainer_id, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, subject || null, message, location || null, numHeight, numWeight, numBmi, enquiryStatus, plan_id, trainer_id, createdByUuid, createdByUuid]
            );

            const [rows] = await pool.query(`${getEnquirySelectQuery()} WHERE enquiries.id = ?`, [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update enquiry status or details
    updateEnquiry: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, phone, subject, message, location, height, weight, bmi, status, planId, trainerId } = req.body;
            const plan_id = await normalizePlanId(planId || req.body.plan_id || null);
            const trainer_id = await normalizeTrainerId(
                trainerId || req.body.trainer_id ||
                ((req.user && String(req.user.role || '').toLowerCase() === 'trainer')
                    ? req.user.userUuid || req.user.employee_id || req.user.employeeId || req.user.id || req.user.userId || req.user.user_id
                    : null)
            );

            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Name, email, and message are required' });
            }

            // Determine admin scope and updated_by value. If a trainer is updating the enquiry,
            // store the trainer's admin_uuid in `updated_by` so admins can see trainer updates.
            let updatedByUuid = getCreatedByUuid(req.user) || null;
            let adminParams = getAdminFilterParams(req.user);
            let hasAdminFilter = adminParams.length > 0;

            if (req.user && String(req.user.role || '').toLowerCase() === 'trainer') {
                const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                const trainerIdNum = req.user.id || req.user.userId || req.user.user_id || null;
                let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                let trainerParams = [];
                if (trainerUuid && trainerIdNum) {
                    trainerStaffQuery += '(employee_id = ? OR id = ?)';
                    trainerParams = [trainerUuid, trainerIdNum];
                } else if (trainerUuid) {
                    trainerStaffQuery += 'employee_id = ?';
                    trainerParams = [trainerUuid];
                } else if (trainerIdNum) {
                    trainerStaffQuery += 'id = ?';
                    trainerParams = [trainerIdNum];
                }

                if (trainerParams.length > 0) {
                    const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                    if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                        updatedByUuid = staffRows[0].admin_uuid;
                        adminParams = [staffRows[0].admin_uuid];
                        hasAdminFilter = true;
                    }
                }
            }
            
            // Add authorization check
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            let whereClause = 'WHERE id = ?';
            let params = [];
            
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    // For trainers: Get their admin_uuid and allow updating any enquiry from that admin
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    
                    let trainerStaffQuery = 'SELECT admin_uuid FROM staff WHERE ';
                    let trainerParams = [];
                    if (trainerUuid && trainerId) {
                        trainerStaffQuery += '(employee_id = ? OR id = ?)';
                        trainerParams = [trainerUuid, trainerId];
                    } else if (trainerUuid) {
                        trainerStaffQuery += 'employee_id = ?';
                        trainerParams = [trainerUuid];
                    } else if (trainerId) {
                        trainerStaffQuery += 'id = ?';
                        trainerParams = [trainerId];
                    }
                    
                    if (trainerParams.length > 0) {
                        const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                        if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                            whereClause += ' AND enquiries.created_by = ?';
                            params = [staffRows[0].admin_uuid, id];
                        } else {
                            params = [id];
                        }
                    } else {
                        params = [id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins: allow updates to enquiries created by them OR by trainers under their admin
                    const adminFilterParams = getAdminFilterParams(req.user);
                    let adminUuid = adminFilterParams[0] || null;
                    let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                    const createdByCandidates = [];
                    if (adminUuid) createdByCandidates.push(adminUuid);
                    if (adminId) createdByCandidates.push(String(adminId));

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

                    if (staffWhere.length > 0) {
                        const [staffRows] = await pool.query(`SELECT employee_id, id, user_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                        for (const s of staffRows) {
                            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                            if (s.user_uuid) createdByCandidates.push(String(s.user_uuid));
                            if (s.id) createdByCandidates.push(String(s.id));
                        }
                    }

                    if (createdByCandidates.length > 0) {
                        const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                        // also include enquiries assigned to trainers under this admin
                        const trainerCandidates = [];
                        if (staffRows && staffRows.length > 0) {
                            for (const s of staffRows) {
                                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                                if (s.user_uuid) trainerCandidates.push(String(s.user_uuid));
                                if (s.id) trainerCandidates.push(String(s.id));
                            }
                        }

                        const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                        const trainerClause = trainerPlaceholders ? ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})` : '';

                        whereClause += ` AND (enquiries.created_by IN (${createdPlaceholders})${trainerClause})`;
                        params = [...createdByCandidates, ...(trainerCandidates.length > 0 ? trainerCandidates : []), id];
                    } else {
                        params = [id];
                    }
                } else {
                    params = [id];
                }
            } else {
                params = [id];
            }

            // Check for duplicate phone/email within the same admin (excluding current enquiry)
            if (phone && hasAdminFilter) {
                const [existingPhone] = await pool.query(
                    `SELECT * FROM enquiries WHERE phone = ? AND ${adminParams.length === 2 ? '(created_by = ? OR created_by = ?)' : 'created_by = ?'} AND id != ?`,
                    [phone, ...adminParams, id]
                );
                if (existingPhone.length > 0) {
                    return res.status(400).json({ error: 'Phone already exists for this admin' });
                }
            }

            if (email && hasAdminFilter) {
                const [existingEmail] = await pool.query(
                    `SELECT * FROM enquiries WHERE email = ? AND ${adminParams.length === 2 ? '(created_by = ? OR created_by = ?)' : 'created_by = ?'} AND id != ?`,
                    [email, ...adminParams, id]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ error: 'Email already exists for this admin' });
                }
            }

            const numHeight = height != null && !isNaN(height) ? Number(height) : null;
            const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
            const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;

            const [result] = await pool.query(
                `UPDATE enquiries SET name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?, height = ?, weight = ?, bmi = ?, status = ?, plan_id = ?, trainer_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`,
                [name, email, phone || null, subject || null, message, location || null, numHeight, numWeight, numBmi, status || 'pending', plan_id, trainer_id, updatedByUuid, ...params]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            const [rows] = await pool.query(`${getEnquirySelectQuery()} WHERE enquiries.id = ?`, [id]);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update enquiry status
    updateEnquiryStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            // Store correct UUID based on user role for audit trail
            let updatedByUuid = getCreatedByUuid(req.user) || null;
            // If trainer, prefer to store their admin_uuid so admin sees updates
            if (req.user && String(req.user.role || '').toLowerCase() === 'trainer') {
                const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                const trainerIdNum = req.user.id || req.user.userId || req.user.user_id || null;
                let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                let trainerParams = [];
                if (trainerUuid && trainerIdNum) {
                    trainerStaffQuery += '(employee_id = ? OR id = ?)';
                    trainerParams = [trainerUuid, trainerIdNum];
                } else if (trainerUuid) {
                    trainerStaffQuery += 'employee_id = ?';
                    trainerParams = [trainerUuid];
                } else if (trainerIdNum) {
                    trainerStaffQuery += 'id = ?';
                    trainerParams = [trainerIdNum];
                }
                if (trainerParams.length > 0) {
                    const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                    if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                        updatedByUuid = staffRows[0].admin_uuid;
                    }
                }
            }
            
            // Add authorization check
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            let whereClause = 'WHERE id = ?';
            let params = [];
            
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    // For trainers: allow updating status of enquiries created by their admin OR assigned to this trainer
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    
                    let trainerStaffQuery = 'SELECT admin_uuid, employee_id, id FROM staff WHERE ';
                    let trainerParams = [];
                    if (trainerUuid && trainerId) {
                        trainerStaffQuery += '(employee_id = ? OR id = ?)';
                        trainerParams = [trainerUuid, trainerId];
                    } else if (trainerUuid) {
                        trainerStaffQuery += 'employee_id = ?';
                        trainerParams = [trainerUuid];
                    } else if (trainerId) {
                        trainerStaffQuery += 'id = ?';
                        trainerParams = [trainerId];
                    }

                    if (trainerParams.length > 0) {
                        const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                        if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                            const adminUuid = staffRows[0].admin_uuid;
                            const empId = staffRows[0].employee_id || staffRows[0].id;
                            whereClause += ' AND (enquiries.created_by = ? OR CAST(enquiries.trainer_id AS CHAR) = ? OR CAST(enquiries.trainer_id AS CHAR) = ?)';
                            params = [adminUuid, empId, String(staffRows[0].id), id];
                        } else {
                            params = [id];
                        }
                    } else {
                        params = [id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins: allow status update for enquiries created by them OR by trainers under their admin
                    const adminFilterParams = getAdminFilterParams(req.user);
                    let adminUuid = adminFilterParams[0] || null;
                    let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                    const createdByCandidates = [];
                    if (adminUuid) createdByCandidates.push(adminUuid);
                    if (adminId) createdByCandidates.push(String(adminId));

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

                    if (staffWhere.length > 0) {
                        const [staffRows] = await pool.query(`SELECT employee_id, id, user_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                        for (const s of staffRows) {
                            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                            if (s.user_uuid) createdByCandidates.push(String(s.user_uuid));
                            if (s.id) createdByCandidates.push(String(s.id));
                        }
                    }

                    if (createdByCandidates.length > 0) {
                        const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                        // also include enquiries assigned to trainers under this admin
                        const trainerCandidates = [];
                        if (staffRows && staffRows.length > 0) {
                            for (const s of staffRows) {
                                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                                if (s.user_uuid) trainerCandidates.push(String(s.user_uuid));
                                if (s.id) trainerCandidates.push(String(s.id));
                            }
                        }

                        const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                        const trainerClause = trainerPlaceholders ? ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})` : '';

                        whereClause += ` AND (enquiries.created_by IN (${createdPlaceholders})${trainerClause})`;
                        params = [...createdByCandidates, ...(trainerCandidates.length > 0 ? trainerCandidates : []), id];
                    } else {
                        params = [id];
                    }
                } else {
                    params = [id];
                }
            } else {
                params = [id];
            }

            const [result] = await pool.query(
                `UPDATE enquiries SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP ${whereClause}`,
                [status, updatedByUuid, ...params]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete enquiry
    deleteEnquiry: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Add authorization check
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            let whereClause = 'WHERE id = ?';
            let params = [];
            
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    // For trainers: allow deleting any enquiry from their admin
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;

                    let trainerStaffQuery = 'SELECT admin_uuid FROM staff WHERE ';
                    let trainerParams = [];
                    if (trainerUuid && trainerId) {
                        trainerStaffQuery += '(employee_id = ? OR id = ?)';
                        trainerParams = [trainerUuid, trainerId];
                    } else if (trainerUuid) {
                        trainerStaffQuery += 'employee_id = ?';
                        trainerParams = [trainerUuid];
                    } else if (trainerId) {
                        trainerStaffQuery += 'id = ?';
                        trainerParams = [trainerId];
                    }

                    if (trainerParams.length > 0) {
                        const [staffRows] = await pool.query(trainerStaffQuery, trainerParams);
                        if (staffRows.length > 0 && staffRows[0].admin_uuid) {
                            whereClause += ' AND enquiries.created_by = ?';
                            params = [staffRows[0].admin_uuid, id];
                        } else {
                            params = [id];
                        }
                    } else {
                        params = [id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins: allow deletes for enquiries created by them OR by trainers under their admin
                    const adminFilterParams = getAdminFilterParams(req.user);
                    let adminUuid = adminFilterParams[0] || null;
                    let adminId = adminFilterParams[1] || adminFilterParams[0] || null;

                    const createdByCandidates = [];
                    if (adminUuid) createdByCandidates.push(adminUuid);
                    if (adminId) createdByCandidates.push(String(adminId));

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

                    if (staffWhere.length > 0) {
                        const [staffRows] = await pool.query(`SELECT employee_id, id, user_uuid FROM staff WHERE ${staffWhere.join(' OR ')}`, staffParams);
                        for (const s of staffRows) {
                            if (s.employee_id) createdByCandidates.push(String(s.employee_id));
                            if (s.user_uuid) createdByCandidates.push(String(s.user_uuid));
                            if (s.id) createdByCandidates.push(String(s.id));
                        }
                    }

                    if (createdByCandidates.length > 0) {
                        const createdPlaceholders = createdByCandidates.map(() => '?').join(',');

                        // also include enquiries assigned to trainers under this admin
                        const trainerCandidates = [];
                        if (staffRows && staffRows.length > 0) {
                            for (const s of staffRows) {
                                if (s.employee_id) trainerCandidates.push(String(s.employee_id));
                                if (s.user_uuid) trainerCandidates.push(String(s.user_uuid));
                                if (s.id) trainerCandidates.push(String(s.id));
                            }
                        }

                        const trainerPlaceholders = trainerCandidates.length > 0 ? trainerCandidates.map(() => '?').join(',') : '';
                        const trainerClause = trainerPlaceholders ? ` OR CAST(enquiries.trainer_id AS CHAR) IN (${trainerPlaceholders})` : '';

                        whereClause += ` AND (enquiries.created_by IN (${createdPlaceholders})${trainerClause})`;
                        params = [...createdByCandidates, ...(trainerCandidates.length > 0 ? trainerCandidates : []), id];
                    } else {
                        params = [id];
                    }
                } else {
                    params = [id];
                }
            } else {
                params = [id];
            }
            
            const [result] = await pool.query(`DELETE FROM enquiries ${whereClause}`, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            res.json({ message: 'Enquiry deleted successfully' });
        } catch (error) {
            console.error('Error deleting enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = enquiryController;