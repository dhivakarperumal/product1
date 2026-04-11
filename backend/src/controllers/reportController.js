const db = require('../config/db');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

async function getReports(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let whereClause = '';
    let params = [];
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        whereClause = ' WHERE created_by = ?';
        params.push(adminUuid);
      }
    }

    // Attendance -> appointments
    const [attendanceRows] = await db.query(`SELECT * FROM attendance ${whereClause} ORDER BY check_in DESC`, params);
    const appointments = attendanceRows.map(r => ({
      ...r,
      // normalize timestamp field to `createdAt` for frontend
      createdAt: r.check_in || r.created_at || r.createdAt,
    }));

    // Products -> inventory
    const [productRows] = await db.query(`SELECT * FROM products ${whereClause} ORDER BY id DESC`, params);
    const inventory = productRows.map(r => ({
      ...r,
      createdAt: r.created_at || r.createdAt || r.updated_at,
    }));

    // Payments -> treatments
    const [paymentRows] = await db.query(`SELECT * FROM payments ${whereClause} ORDER BY payment_date DESC`, params);
    const treatments = paymentRows.map(r => ({
      ...r,
      createdAt: r.payment_date || r.created_at || r.createdAt,
    }));

    // Enquiries
    const [enquiryRows] = await db.query(`SELECT * FROM enquiries ${whereClause} ORDER BY created_at DESC`, params);
    const enquiries = enquiryRows.map(r => ({
      ...r,
      createdAt: r.created_at || r.createdAt,
    }));

    res.json({ appointments, inventory, treatments, enquiries });
  } catch (err) {
    console.error('getReports error', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

module.exports = { getReports };
