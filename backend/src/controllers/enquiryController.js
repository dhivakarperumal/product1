const pool = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// NOTE: use getActorUuid(req.user) from utils/auditTrail for actor UUID

const getEnquirySelectQuery = () =>
  `SELECT enquiries.*, COALESCE(staff.username, staff.name, staff.email, staff.employee_id, enquiries.trainer_id) AS trainer_display_name
   FROM enquiries
   LEFT JOIN staff ON enquiries.trainer_id = staff.employee_id OR enquiries.trainer_id = staff.id`;

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
                whereClauses.push('created_by = ?');
                params.push(created_by);
            } else if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    if (trainerUuid || trainerId) {
                        if (trainerUuid && trainerId) {
                            whereClauses.push('(trainer_id = ? OR trainer_id = ?)');
                            params.push(trainerUuid, trainerId);
                        } else if (trainerUuid) {
                            whereClauses.push('trainer_id = ?');
                            params.push(trainerUuid);
                        } else {
                            whereClauses.push('trainer_id = ?');
                            params.push(trainerId);
                        }
                    }
                } else if (userRole === 'admin') {
                    // Regular admins should only see enquiries created by them
                    const adminFilterParams = getAdminFilterParams(req.user);
                    if (adminFilterParams.length > 0) {
                        if (adminFilterParams.length === 2) {
                            whereClauses.push('(created_by = ? OR created_by = ?)');
                            params.push(...adminFilterParams);
                        } else {
                            whereClauses.push('created_by = ?');
                            params.push(...adminFilterParams);
                        }
                    }
                }
            }

            if (whereClauses.length > 0) {
                query += ' WHERE ' + whereClauses.join(' AND ');
            }

            query += ' ORDER BY created_at DESC';

            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching enquiries:', error);
            res.status(500).json({ error: 'Internal server error' });
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
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    if (trainerUuid && trainerId) {
                        authClauses.push('(enquiries.trainer_id = ? OR enquiries.trainer_id = ?)');
                        params.push(trainerUuid, trainerId);
                    } else if (trainerUuid) {
                        authClauses.push('enquiries.trainer_id = ?');
                        params.push(trainerUuid);
                    } else {
                        authClauses.push('enquiries.trainer_id = ?');
                        params.push(trainerId);
                    }
                } else if (userRole === 'admin') {
                    // Regular admins can only view enquiries they created
                    const adminFilterParams = getAdminFilterParams(req.user);
                    if (adminFilterParams.length === 2) {
                        authClauses.push('(enquiries.created_by = ? OR enquiries.created_by = ?)');
                        params.push(...adminFilterParams);
                    } else if (adminFilterParams.length === 1) {
                        authClauses.push('enquiries.created_by = ?');
                        params.push(...adminFilterParams);
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
            const trainer_id = await normalizeTrainerId(
                trainerId || req.body.trainer_id ||
                ((req.user && String(req.user.role || '').toLowerCase() === 'trainer')
                    ? req.user.userUuid || req.user.employee_id || req.user.employeeId || req.user.id || req.user.userId || req.user.user_id
                    : null)
            );
            const enquiryStatus = status || 'pending';

            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Name, email, and message are required' });
            }

            // Store correct UUID based on user role (admin or trainer)
            const createdByUuid = getCreatedByUuid(req.user) || null;
            const adminParams = getAdminFilterParams(req.user);
            const hasAdminFilter = adminParams.length > 0;

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

            // Store correct UUID based on user role (admin or trainer)
            const updatedByUuid = getCreatedByUuid(req.user) || null;
            const adminParams = getAdminFilterParams(req.user);
            const hasAdminFilter = adminParams.length > 0;
            
            // Add authorization check
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            let whereClause = 'WHERE id = ?';
            let params = [];
            
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    if (trainerUuid && trainerId) {
                        whereClause += ' AND (trainer_id = ? OR trainer_id = ?)';
                        params = [trainerUuid, trainerId, id];
                    } else if (trainerUuid) {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerUuid, id];
                    } else {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerId, id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins can only update enquiries they created
                    if (adminParams.length === 2) {
                        whereClause += ' AND (created_by = ? OR created_by = ?)';
                        params = [...adminParams, id];
                    } else if (adminParams.length === 1) {
                        whereClause += ' AND created_by = ?';
                        params = [...adminParams, id];
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
            const updatedByUuid = getCreatedByUuid(req.user) || null;
            
            // Add authorization check
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            const userRole = req.user && String(req.user.role || '').toLowerCase();
            let whereClause = 'WHERE id = ?';
            let params = [];
            
            if (!isSuperAdmin && req.user) {
                if (userRole === 'trainer') {
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    if (trainerUuid && trainerId) {
                        whereClause += ' AND (trainer_id = ? OR trainer_id = ?)';
                        params = [trainerUuid, trainerId, id];
                    } else if (trainerUuid) {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerUuid, id];
                    } else {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerId, id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins can only update status of enquiries they created
                    const adminParams = getAdminFilterParams(req.user);
                    if (adminParams.length === 2) {
                        whereClause += ' AND (created_by = ? OR created_by = ?)';
                        params = [...adminParams, id];
                    } else if (adminParams.length === 1) {
                        whereClause += ' AND created_by = ?';
                        params = [...adminParams, id];
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
                    const trainerUuid = req.user.userUuid || req.user.employee_id || req.user.employeeId || null;
                    const trainerId = req.user.id || req.user.userId || req.user.user_id || null;
                    if (trainerUuid && trainerId) {
                        whereClause += ' AND (trainer_id = ? OR trainer_id = ?)';
                        params = [trainerUuid, trainerId, id];
                    } else if (trainerUuid) {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerUuid, id];
                    } else {
                        whereClause += ' AND trainer_id = ?';
                        params = [trainerId, id];
                    }
                } else if (userRole === 'admin') {
                    // Regular admins can only delete enquiries they created
                    const adminParams = getAdminFilterParams(req.user);
                    if (adminParams.length === 2) {
                        whereClause += ' AND (created_by = ? OR created_by = ?)';
                        params = [...adminParams, id];
                    } else if (adminParams.length === 1) {
                        whereClause += ' AND created_by = ?';
                        params = [...adminParams, id];
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