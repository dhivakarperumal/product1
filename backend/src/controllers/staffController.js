const db = require('../config/db');

async function generateEmployeeId(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [select] = await connection.query("SELECT current FROM counters WHERE name = ? FOR UPDATE", ['employees']);
    
    if (select.length === 0) {
      await connection.query("INSERT INTO counters(name, current) VALUES (?, ?)", ['employees', 1]);
      await connection.commit();
      return res.json({ employeeId: `EMP${String(1).padStart(3, '0')}` });
    }

    const current = select[0].current || 0;
    const next = current + 1;
    await connection.query('UPDATE counters SET current = ? WHERE name = ?', [next, 'employees']);
    await connection.commit();
    return res.json({ employeeId: `EMP${String(next).padStart(3, '0')}` });
  } catch (err) {
    await connection.rollback();
    console.error('generateEmployeeId error', err);
    res.status(500).json({ error: 'Failed to generate employee id' });
  } finally {
    connection.release();
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
      const adminUuid = req.user?.adminUuid || req.user?.userUuid;
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

const bcrypt = require('bcryptjs');
const { getActorUuid } = require('../utils/auditTrail');

async function createStaff(req, res) {
  // create staff record and also add a user entry for login (trainer role)
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = req.body;

    // For admin creating staff, use their UUID as the audit trail
    // req.user comes from JWT which has adminUuid and userUuid
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;

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
      adminUuid,  // created_by = admin UUID
      adminUuid,  // updated_by = admin UUID
      new Date(),
      new Date(),
    ];

    const [result] = await connection.query(query, params);

    // create corresponding user entry (trainer role)
    try {
      const passwordToHash = body.password || body.phone || '';
      const hashed = passwordToHash ? await bcrypt.hash(passwordToHash, 10) : null;
      const userRole = 'trainer';
      const userAdminId = req.user?.role === 'admin' ? req.user.userId : null;
      
      await connection.query(
        `INSERT INTO users (email, password_hash, role, username, mobile, admin_id, admin_uuid, subscription_status, user_uuid, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, UUID(), ?, ?)`,
        [body.email || null, hashed, userRole, body.username || null, body.phone || null, userAdminId, adminUuid, 'active', adminUuid, adminUuid]
      );
    } catch (userErr) {
      // duplicate user entries should not block staff creation,
      // just log warning and continue
      if (userErr.code === 'ER_DUP_ENTRY') {
        console.warn('createStaff: user already exists, skipping user insert');
      } else {
        console.error('createStaff user insert error', userErr);
        // rollback entire transaction because something unexpected happened
        throw userErr;
      }
    }

    await connection.commit();

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
    await connection.rollback();
    console.error('createStaff error', err);
    res.status(500).json({ error: 'Failed to create staff' });
  } finally {
    connection.release();
  }
}

async function updateStaff(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const body = req.body;

    const [existingRows] = isNum
      ? await connection.query('SELECT * FROM staff WHERE id = ?', [idNum])
      : await connection.query('SELECT * FROM staff WHERE employee_id = ?', [id]);

    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Check authorization - admin can only update their own staff
    if (req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.userUuid;
      if (adminUuid && existingRows[0].admin_uuid !== adminUuid) {
        await connection.rollback();
        return res.status(403).json({ error: 'Not authorized to update this staff member' });
      }
    }

    let query;
    let params;
    
    // Use admin's UUID for audit trail
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;

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
      adminUuid,  // updated_by = admin UUID
    ];

    if (isNum) {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        department = ?, gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      params = [...baseParams, idNum];
    } else {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        department = ?, gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?`;
      params = [...baseParams, id];
    }

    const [result] = await connection.query(query, params);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Staff not found' });
    }

    // try to update user entry if it exists
    try {
      const userUpdateFields = [];
      const userParams = [];
      if (body.email !== undefined) {
        userUpdateFields.push('email = ?');
        userParams.push(body.email);
      }
      if (body.username !== undefined) {
        userUpdateFields.push('username = ?');
        userParams.push(body.username);
      }
      if (body.phone !== undefined) {
        userUpdateFields.push('mobile = ?');
        userParams.push(body.phone);
      }
      // we do not update role here; users created from staff are always trainers
      if (userUpdateFields.length > 0) {
        // identify user by email or username before update
        // we cannot guarantee unique id, so use existing email/username from body
        const whereClause = [];
        const whereParams = [];
        if (body.email) {
          whereClause.push('email = ?');
          whereParams.push(body.email);
        }
        if (body.username) {
          whereClause.push('username = ?');
          whereParams.push(body.username);
        }
        if (whereClause.length > 0) {
          const updateSql = `UPDATE users SET ${userUpdateFields.join(', ')} WHERE ${whereClause.join(' OR ')}`;
          await connection.query(updateSql, [...userParams, ...whereParams]);
        }
      }
    } catch (userErr) {
      console.warn('updateStaff: failed to sync user record', userErr.message);
      // not fatal; continue
    }

    // Fetch the updated staff record
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

    await connection.commit();
    res.json(rows[0]);
  } catch (err) {
    await connection.rollback();
    console.error('updateStaff error', err);
    res.status(500).json({ error: 'Failed to update staff' });
  } finally {
    connection.release();
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
    // Filter by admin's UUID if user is an admin
    if (req.user?.role === 'admin') {
      const adminUuid = req.user?.adminUuid || req.user?.userUuid;
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
      const adminUuid = req.user?.adminUuid || req.user?.userUuid;
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
