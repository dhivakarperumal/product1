const db = require('../config/db');

async function generateEmployeeId(req, res) {
  try {
    // Get current counter or initialize at 0
    const [rows] = await db.query("SELECT current FROM counters WHERE name = ?", ['employees']);
    
    let nextNumber = 1;
    if (rows.length > 0) {
      nextNumber = (rows[0].current || 0) + 1;
      await db.query('UPDATE counters SET current = ? WHERE name = ?', [nextNumber, 'employees']);
    } else {
      await db.query("INSERT INTO counters(name, current) VALUES (?, ?)", ['employees', 1]);
    }

    res.json({ employeeId: `EMP${String(nextNumber).padStart(3, '0')}` });
  } catch (err) {
    console.error('generateEmployeeId error', err.message);
    res.status(500).json({ error: 'Failed to generate employee id', details: err.message });
  }
}

async function getStaffById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT * FROM staff WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT * FROM staff WHERE employee_id = ?`;
      params = [id];
    }

    // Filter by admin's UUID if user is an admin
    if (req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
      if (adminUuid) {
        query += ' AND admin_uuid = ?';
        params.push(adminUuid);
      }
    }
    
    const [rows] = await db.query(query, params);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getStaffById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

const { getActorUuid } = require('../utils/auditTrail');

async function createStaff(req, res) {
  try {
    const body = req.body;

    // For admin creating staff, extract admin UUID for audit trail
    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
    const createdBy = adminUuid;

    const query = `INSERT INTO staff
      (employee_id, username, name, email, phone, role, department, gender, blood_group,
       dob, joining_date, qualification, experience, shift, salary, address,
       emergency_name, emergency_phone, status, time_in, time_out,
       photo, aadhar_doc, id_doc, certificate_doc, admin_uuid, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
      body.employee_id || null,
      body.username || null,
      body.name || null,
      body.email || null,
      body.phone || null,
      body.role || null,
      body.department || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
      adminUuid,
      createdBy,
      createdBy,
      new Date(),
      new Date(),
    ];

    const [result] = await db.query(query, params);

    // Fetch the created staff record
    let fetchQuery;
    let fetchParams;
    if (body.employee_id) {
      fetchQuery = `SELECT * FROM staff WHERE employee_id = ?`;
      fetchParams = [body.employee_id];
    } else {
      fetchQuery = `SELECT * FROM staff WHERE id = ?`;
      fetchParams = [result.insertId];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[createStaff] ERROR:', err.message, 'Code:', err.code, 'SQL:', err.sqlMessage);
    res.status(500).json({ error: 'Failed to create staff', details: err.message });
  }
}

async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    const body = req.body;

    // Check if staff exists first
    const [existingRows] = isNum
      ? await db.query('SELECT * FROM staff WHERE id = ?', [idNum])
      : await db.query('SELECT * FROM staff WHERE employee_id = ?', [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Check authorization - admin can only update their own staff
    if (req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
      if (adminUuid && existingRows[0].admin_uuid !== adminUuid) {
        return res.status(403).json({ error: 'Not authorized to update this staff member' });
      }
    }

    // Extract admin UUID for audit trail
    const updatedBy = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;

    const baseParams = [
      body.employee_id || null,
      body.username || null,
      body.name || null,
      body.email || null,
      body.phone || null,
      body.role || null,
      body.department || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
      updatedBy,
    ];

    let query;
    let params;
    
    if (isNum) {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        department = ?, gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      params = [...baseParams, updatedBy, idNum];
    } else {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        department = ?, gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?`;
      params = [...baseParams, updatedBy, id];
    }

    await db.query(query, params);

    // Fetch and return updated record
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = `SELECT * FROM staff WHERE id = ?`;
      fetchParams = [idNum];
    } else {
      fetchQuery = `SELECT * FROM staff WHERE employee_id = ?`;
      fetchParams = [id];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.json(rows[0]);
  } catch (err) {
    console.error('updateStaff error', err.message, err.code, err.sqlMessage);
    res.status(500).json({ error: 'Failed to update staff', details: err.message });
  }
}

async function getAllStaff(req, res) {
  try {
    const { role } = req.query;
    let sql = 'SELECT * FROM staff';
    const params = [];
    const conditions = [];
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    // Filter by admin's UUID if user is an admin (not super admin)
    if (!isSuperAdmin && req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
      if (adminUuid) {
        conditions.push('admin_uuid = ?');
        params.push(adminUuid);
      }
    }
    
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAllStaff error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT * FROM staff WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT * FROM staff WHERE employee_id = ?`;
      params = [id];
    }

    const [existingRows] = await db.query(query, params);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    
    // Check authorization - admin can only delete their own staff
    if (req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
      if (adminUuid && existingRows[0].admin_uuid !== adminUuid) {
        return res.status(403).json({ error: 'Not authorized to delete this staff member' });
      }
    }

    if (isNum) {
      query = `DELETE FROM staff WHERE id = ?`;
      params = [idNum];
    } else {
      query = `DELETE FROM staff WHERE employee_id = ?`;
      params = [id];
    }
    
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error('deleteStaff error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  generateEmployeeId,
  getStaffById,
  createStaff,
  updateStaff,
  getAllStaff,
  deleteStaff,
};
