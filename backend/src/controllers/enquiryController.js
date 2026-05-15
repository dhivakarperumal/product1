const pool = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// Extract admin UUID from request user - prioritize adminUuid
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

const getEnquirySelectQuery = () =>
  `SELECT enquiries.*, COALESCE(staff.username, staff.name, staff.email, staff.employee_id, enquiries.trainer_id) AS trainer_display_name
   FROM enquiries
   LEFT JOIN staff ON enquiries.trainer_id = staff.employee_id OR enquiries.trainer_id = staff.id`;

const isNumeric = (value) =>
  typeof value === 'number' || (/^\d+$/.test(String(value || '').trim()));

const getAdminFilterParams = (user) => {
  const adminUuid = getAdminUuid(user);
  const adminId = user?.userId || user?.user_id || user?.id || null;
  const params = [];
  if (adminUuid) params.push(adminUuid);
  if (adminId) params.push(adminId);
  return params;
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

            let query = getEnquirySelectQuery();
            let params = [];
            let whereClauses = [];

            if (!isSuperAdmin && req.user) {
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
                }
                // Admin users should see enquiries for all trainers, not just those they created.
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
            const [rows] = await pool.query(`${getEnquirySelectQuery()} WHERE enquiries.id = ?`, [id]);

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

            // Store actor UUID for audit trail (admin/trainer/member)
            const actorUuid = getActorUuid(req.user) || null;
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
                [name, email, phone, subject || null, message, location || null, numHeight, numWeight, numBmi, enquiryStatus, plan_id, trainer_id, actorUuid, actorUuid]
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

            const actorUuid = getActorUuid(req.user) || null;
            const adminParams = getAdminFilterParams(req.user);
            const hasAdminFilter = adminParams.length > 0;

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
                'UPDATE enquiries SET name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?, height = ?, weight = ?, bmi = ?, status = ?, plan_id = ?, trainer_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, email, phone || null, subject || null, message, location || null, numHeight, numWeight, numBmi, status || 'pending', plan_id, trainer_id, actorUuid, id]
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

            // Store actor UUID for audit trail (admin/trainer/member)
            const actorUuid = getActorUuid(req.user) || null;

            const [result] = await pool.query(
                'UPDATE enquiries SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, actorUuid, id]
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
            const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);

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