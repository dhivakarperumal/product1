const pool = require('../config/db');

// Extract admin UUID from request user - prioritize adminUuid
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

const enquiryController = {
    // Get all enquiries - filtered by admin_uuid if not a super admin
    getAllEnquiries: async (req, res) => {
        try {
            // Check if user is super admin
            const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
            
            let query = 'SELECT * FROM enquiries';
            let params = [];
            
            // If not super admin, filter by created_by (admin_uuid)
            if (!isSuperAdmin && req.user) {
                const adminUuid = getAdminUuid(req.user);
                if (adminUuid) {
                    query += ' WHERE created_by = ?';
                    params.push(adminUuid);
                }
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
            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);

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
            const { name, email, phone, subject, message, location, height, weight, bmi } = req.body;

            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Name, email, and message are required' });
            }

            // Store admin UUID for audit trail
            const adminUuid = getAdminUuid(req.user) || null;

            // Check for duplicate phone/email within the same admin
            if (phone) {
                const [existingPhone] = await pool.query(
                    'SELECT * FROM enquiries WHERE phone = ? AND created_by = ?',
                    [phone, adminUuid]
                );
                if (existingPhone.length > 0) {
                    return res.status(400).json({ error: 'Phone already exists for this admin' });
                }
            }

            if (email) {
                const [existingEmail] = await pool.query(
                    'SELECT * FROM enquiries WHERE email = ? AND created_by = ?',
                    [email, adminUuid]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ error: 'Email already exists for this admin' });
                }
            }

            const numHeight = height != null && !isNaN(height) ? Number(height) : null;
            const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
            const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;

            const [result] = await pool.query(
                'INSERT INTO enquiries (name, email, phone, subject, message, location, height, weight, bmi, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, subject || null, message, location || null, numHeight, numWeight, numBmi, adminUuid, adminUuid]
            );

            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [result.insertId]);
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
            const { name, email, phone, subject, message, location, height, weight, bmi, status } = req.body;

            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Name, email, and message are required' });
            }

            const adminUuid = getAdminUuid(req.user) || null;

            // Check for duplicate phone/email within the same admin (excluding current enquiry)
            if (phone) {
                const [existingPhone] = await pool.query(
                    'SELECT * FROM enquiries WHERE phone = ? AND created_by = ? AND id != ?',
                    [phone, adminUuid, id]
                );
                if (existingPhone.length > 0) {
                    return res.status(400).json({ error: 'Phone already exists for this admin' });
                }
            }

            if (email) {
                const [existingEmail] = await pool.query(
                    'SELECT * FROM enquiries WHERE email = ? AND created_by = ? AND id != ?',
                    [email, adminUuid, id]
                );
                if (existingEmail.length > 0) {
                    return res.status(400).json({ error: 'Email already exists for this admin' });
                }
            }

            const numHeight = height != null && !isNaN(height) ? Number(height) : null;
            const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
            const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;

            const [result] = await pool.query(
                'UPDATE enquiries SET name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?, height = ?, weight = ?, bmi = ?, status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, email, phone || null, subject || null, message, location || null, numHeight, numWeight, numBmi, status || 'pending', adminUuid, id]
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

    // Update enquiry status
    updateEnquiryStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            // Store admin UUID for audit trail
            const adminUuid = getAdminUuid(req.user) || null;

            const [result] = await pool.query(
                'UPDATE enquiries SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, adminUuid, id]
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