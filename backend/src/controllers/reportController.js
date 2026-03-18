const db = require('../config/db');

async function getReports(req, res) {
  try {
    // Attendance -> appointments
    const [attendanceRows] = await db.query('SELECT * FROM attendance ORDER BY check_in DESC');
    const appointments = attendanceRows.map(r => ({
      ...r,
      // normalize timestamp field to `createdAt` for frontend
      createdAt: r.check_in || r.created_at || r.createdAt,
    }));

    // Products -> inventory
    const [productRows] = await db.query('SELECT * FROM products ORDER BY id DESC');
    const inventory = productRows.map(r => ({
      ...r,
      createdAt: r.created_at || r.createdAt || r.updated_at,
    }));

    // Payments -> treatments
    const [paymentRows] = await db.query('SELECT * FROM payments ORDER BY payment_date DESC');
    const treatments = paymentRows.map(r => ({
      ...r,
      createdAt: r.payment_date || r.created_at || r.createdAt,
    }));

    // Enquiries
    const [enquiryRows] = await db.query('SELECT * FROM enquiries ORDER BY created_at DESC');
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
