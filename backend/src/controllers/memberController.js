const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

let memberTableName = null;

async function resolveMemberTable() {
  if (memberTableName) return memberTableName;

  const [memberRows] = await db.query("SHOW TABLES LIKE 'members'");
  if (memberRows.length > 0) {
    const [cols] = await db.query("SHOW COLUMNS FROM members LIKE 'member_id'");
    if (cols.length > 0) {
      memberTableName = 'members';
      return memberTableName;
    }
  }

  const [gymRows] = await db.query("SHOW TABLES LIKE 'gym_members'");
  if (gymRows.length > 0) {
    memberTableName = 'gym_members';
    return memberTableName;
  }

  memberTableName = 'members';
  return memberTableName;
}

async function getAllMembers(req, res) {
  try {
    const membersTable = await resolveMemberTable();

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = getAdminUuid(req.user);
    
    let whereClauses = [];
    let params = [];
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      if (adminUuid) {
        whereClauses.push('gm.created_by = ?');
        params.push(adminUuid);
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        gm.id, 
        gm.member_id, 
        gm.name, 
        gm.phone, 
        gm.email, 
        gm.gender,
        gm.height,
        gm.weight,
        gm.bmi,
        gm.address,
        gm.plan,
        gm.status,
        u.id AS user_id,
        u.user_uuid AS u_id,
        (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
        (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count,
        gm.created_at,
        'members' AS source
      FROM ${membersTable} gm
      LEFT JOIN users u ON (u.email = gm.email OR u.mobile = gm.phone)
      ${whereClause}
      ORDER BY gm.created_at DESC
    `;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAllMembers query failed:', err.code, err.sqlMessage || err.message);
    console.error('getAllMembers full error:', err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
}

async function getMemberById(req, res) {
  try {
    const membersTable = await resolveMemberTable();
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    let sql;
    let params;
    if (isNum) {
      sql = `
        SELECT gm.*,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM ${membersTable} gm
        WHERE gm.id = ?
      `;
      params = [idNum];
    } else {
      sql = `
        SELECT gm.*,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM ${membersTable} gm
        WHERE gm.member_id = ?
      `;
      params = [id];
    }

    const [rows] = await db.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getMemberById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createMember(req, res) {
  const {
    name, phone, email, gender, height, weight, bmi,
    plan, duration, status,
    photo, notes, address
  } = req.body;
  const joinDate = req.body.joinDate || req.body.join_date || new Date().toISOString().split('T')[0];
  const expiryDate = req.body.expiryDate || req.body.expiry_date || null;

  console.log('createMember received:', { name, phone, email, gender, height, weight, bmi, plan, duration, joinDate, expiryDate, status, photo: photo ? 'base64...' : null, notes, address });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Validate required fields
    if (!name || !phone) {
      await connection.rollback();
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const membersTable = await resolveMemberTable();

    // Get admin UUID - prioritize adminUuid, then userUuid
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || req.user?.admin_uuid || req.user?.user_uuid || null;
    const currentUserUuid = adminUuid;

    // duplicate phone/email check within the same admin
    if (phone) {
      const [existingPhone] = await connection.query(
        `SELECT * FROM ${membersTable} WHERE phone = ?${currentUserUuid ? ' AND created_by = ?' : ''}`,
        currentUserUuid ? [phone, currentUserUuid] : [phone]
      );
      if (existingPhone.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Phone already exists for this admin" });
      }
    }

    if (email) {
      const [existingEmail] = await connection.query(
        `SELECT * FROM ${membersTable} WHERE email = ?${currentUserUuid ? ' AND created_by = ?' : ''}`,
        currentUserUuid ? [email, currentUserUuid] : [email]
      );
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Email already exists for this admin" });
      }
    }

    // Parse numeric fields early so they can be used in insert loop
    const numHeight = height != null && !isNaN(height) ? Number(height) : null;
    const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
    const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
    const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

    // Generate UUID for member_id
    const memberId = randomUUID();

    // Insert member with UUID
    let result;
    try {
      [result] = await connection.query(
        `INSERT INTO ${membersTable}
      (member_id, name, phone, email, gender, height, weight, bmi, plan, duration,
       join_date, expiry_date, status, photo, notes, address, created_by, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          memberId, name, phone, email, gender, numHeight, numWeight, numBmi,
          plan, numDuration, joinDate, expiryDate, status, photo, notes, address,
          currentUserUuid, currentUserUuid
        ]
      );
    } catch (err) {
      throw err;
    }

    await connection.commit();

    // fetch back the inserted member with counts
    const [fetched] = await connection.query(
      `
      SELECT gm.*,
             (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
             (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
      FROM ${membersTable} gm
      WHERE gm.id = ?
      `,
      [result.insertId]
    );
    const member = fetched[0] || {
      id: result.insertId,
      member_id: memberId,
      name, phone, email, gender, height: numHeight, weight: numWeight, bmi: numBmi, plan, duration: numDuration,
      join_date: joinDate, expiry_date: expiryDate, status, photo, notes, address
    };

    res.json(member);
  } catch (err) {
    await connection.rollback();
    console.error('createMember error:', err.code, err.sqlMessage || err.message);
    console.error('createMember full error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
}

async function updateMember(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const membersTable = await resolveMemberTable();

    // Get admin UUID - prioritize adminUuid, then userUuid
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || req.user?.admin_uuid || req.user?.user_uuid || null;
    const currentUserUuid = adminUuid;
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    const { name, phone, email, gender, height, weight, bmi,
      plan, duration, joinDate, expiryDate, status,
      photo, notes, address } = req.body;
    // ensure numeric values are correctly typed
    const numHeight = height != null && !isNaN(height) ? Number(height) : null;
    const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
    const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
    const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

    // Determine the member owner so uniqueness is enforced per admin
    let ownerUuid = currentUserUuid;
    const selectOwnerQuery = isNum
      ? `SELECT created_by, phone, email FROM ${membersTable} WHERE id = ?`
      : `SELECT created_by, phone, email FROM ${membersTable} WHERE member_id = ?`;
    const [ownerRows] = await connection.query(selectOwnerQuery, [isNum ? idNum : id]);
    if (ownerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Member not found' });
    }
    if (ownerRows[0].created_by) {
      ownerUuid = ownerRows[0].created_by;
    }

    const existingPhone = ownerRows[0].phone;
    const existingEmail = ownerRows[0].email;
    const hasPhoneChanged = phone && existingPhone !== String(phone);

    // Check for duplicate phone if phone is being updated
    if (phone) {
      let dupQuery;
      let dupParams;
      if (isNum) {
        dupQuery = `SELECT * FROM ${membersTable} WHERE phone = ? AND created_by = ? AND id != ?`;
        dupParams = [phone, ownerUuid, idNum];
      } else {
        dupQuery = `SELECT * FROM ${membersTable} WHERE phone = ? AND created_by = ? AND member_id != ?`;
        dupParams = [phone, ownerUuid, id];
      }

      const [existing] = await connection.query(dupQuery, dupParams);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Phone already exists for this admin" });
      }
    }

    // Check for duplicate email if email is being updated
    if (email) {
      let dupEmailQuery;
      let dupEmailParams;
      if (isNum) {
        dupEmailQuery = `SELECT * FROM ${membersTable} WHERE email = ? AND created_by = ? AND id != ?`;
        dupEmailParams = [email, ownerUuid, idNum];
      } else {
        dupEmailQuery = `SELECT * FROM ${membersTable} WHERE email = ? AND created_by = ? AND member_id != ?`;
        dupEmailParams = [email, ownerUuid, id];
      }

      const [existingEmail] = await connection.query(dupEmailQuery, dupEmailParams);
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Email already exists for this admin" });
      }
    }

    let updateQuery;
    let updateParams;
    if (isNum) {
      updateQuery = `UPDATE ${membersTable} SET
        name=?, phone=?, email=?, gender=?,
        height=?, weight=?, bmi=?, plan=?, duration=?,
        join_date=?, expiry_date=?, status=?,
        photo=?, notes=?, address=?,
        updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`;
      updateParams = [
        name, phone, email, gender, numHeight, numWeight, numBmi,
        plan, numDuration, joinDate, expiryDate, status,
        photo, notes, address, currentUserUuid, idNum
      ];
    } else {
      updateQuery = `UPDATE ${membersTable} SET
        name=?, phone=?, email=?, gender=?,
        height=?, weight=?, bmi=?, plan=?, duration=?,
        join_date=?, expiry_date=?, status=?,
        photo=?, notes=?, address=?,
        updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE member_id=?`;
      updateParams = [
        name, phone, email, gender, numHeight, numWeight, numBmi,
        plan, numDuration, joinDate, expiryDate, status,
        photo, notes, address, currentUserUuid, id
      ];
    }

    const [result] = await connection.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member not found' });
    }

    // Fetch the updated member with counts
    let sql;
    let params;
    if (isNum) {
      sql = `
        SELECT gm.*,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM ${membersTable} gm
        WHERE gm.id = ?
      `;
      params = [idNum];
    } else {
      sql = `
        SELECT gm.*,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM ${membersTable} gm
        WHERE gm.member_id = ?
      `;
      params = [id];
    }

    const [rows] = await connection.query(sql, params);
    await connection.commit();
    res.json(rows[0]);

  } catch (err) {
    await connection.rollback();
    console.error('updateMember error', err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
}

async function deleteMember(req, res) {
  try {
    const membersTable = await resolveMemberTable();
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    let deleteQuery;
    let deleteParams;
    if (isNum) {
      deleteQuery = `DELETE FROM ${membersTable} WHERE id = ?`;
      deleteParams = [idNum];
    } else {
      deleteQuery = `DELETE FROM ${membersTable} WHERE member_id = ?`;
      deleteParams = [id];
    }

    const [result] = await db.query(deleteQuery, deleteParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    console.error('deleteMember error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

async function getMemberPlans(req, res) {
  try {
    const membersTable = await resolveMemberTable();
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    let sql;
    let params;
    if (!isNaN(idNum)) {
      sql = `
        SELECT m.membership_plan_id, p.*, m.is_active as member_active
        FROM ${membersTable} m
        LEFT JOIN plans p ON m.membership_plan_id = p.id
        WHERE m.id = ?
      `;
      params = [idNum];
    } else {
      sql = `
        SELECT m.membership_plan_id, p.*, m.is_active as member_active
        FROM ${membersTable} m
        LEFT JOIN plans p ON m.membership_plan_id = p.id
        WHERE m.member_id = ?
      `;
      params = [id];
    }

    const [rows] = await db.query(sql, params);

    if (rows.length === 0) {
      return res.json([]); // No member found, return empty array
    }

    const member = rows[0];

    if (!member.membership_plan_id) {
      return res.json([]); // No plan assigned
    }

    // Return plan with status
    const planWithStatus = {
      ...member,
      status: member.member_active ? 'active' : 'inactive'
    };

    // Remove redundant fields
    delete planWithStatus.membership_plan_id;
    delete planWithStatus.member_active;

    res.json([planWithStatus]);
  } catch (err) {
    console.error('getMemberPlans error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = { getAllMembers, getMemberById, createMember, updateMember, deleteMember, getMemberPlans };