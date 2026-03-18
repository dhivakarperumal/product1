const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function getAllMembers(req, res) {
  try {
    // We want a list that includes:
    // 1. All records from gym_members (joined with their user account)
    // 2. All records from users (role='user') that don't have a gym_member record yet
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
        gm.plan,
        gm.status,
        u.id AS u_id, 
        u.email AS user_email, 
        u.role,
        (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
        (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count,
        gm.created_at,
        'members' as source
      FROM gym_members gm
      LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') 
                        OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
      
      UNION ALL
      
      SELECT 
        NULL as id, 
        NULL as member_id, 
        u.username as name, 
        u.mobile as phone, 
        u.email, 
        NULL as gender,
        NULL as height,
        NULL as weight,
        NULL as bmi,
        NULL as plan,
        'active' as status,
        u.id AS u_id, 
        u.email AS user_email, 
        u.role,
        0 AS workout_count,
        0 AS diet_count,
        u.created_at,
        'users' as source
      FROM users u
      WHERE u.role = 'user' AND NOT EXISTS (
        SELECT 1 FROM gym_members gm2 
        WHERE (gm2.email = u.email AND u.email IS NOT NULL AND u.email != '') 
           OR (gm2.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
      )
      
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('getAllMembers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    let sql;
    let params;
    if (isNum) {
      sql = `
        SELECT gm.*,
               u.id AS u_id,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        WHERE gm.id = ?
      `;
      params = [idNum];
    } else {
      sql = `
        SELECT gm.*,
               u.id AS u_id,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
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
    plan, duration, joinDate, expiryDate, status,
    photo, notes, address,
    username, password
  } = req.body;

  console.log('createMember received:', { name, phone, email, gender, height, weight, bmi, plan, duration, joinDate, expiryDate, status, photo: photo ? 'base64...' : null, notes, address, username });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Validate required fields
    if (!name || !phone) {
      await connection.rollback();
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // duplicate phone check
    const [existing] = await connection.query(
      "SELECT * FROM gym_members WHERE phone = ?",
      [phone]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Phone already exists" });
    }

    // Parse numeric fields early so they can be used in insert loop
    const numHeight = height != null && !isNaN(height) ? Number(height) : null;
    const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
    const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
    const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

    // generate member_id using max numeric suffix, more robust than simple count
    const [maxResult] = await connection.query(
      "SELECT MAX(CAST(SUBSTRING(member_id,3) AS UNSIGNED)) as maxnum FROM gym_members"
    );
    let nextNumber = (maxResult[0].maxnum || 0) + 1;
    let memberId = `MB${String(nextNumber).padStart(3, "0")}`;

    // In rare case of duplicate (concurrent inserts), retry once
    let inserted = false;
    let result;
    let insertResult;
    for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
      try {
        [result] = await connection.query(
          `INSERT INTO gym_members
      (member_id, name, phone, email, gender, height, weight, bmi, plan, duration,
       join_date, expiry_date, status, photo, notes, address)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            memberId, name, phone, email, gender, numHeight, numWeight, numBmi,
            plan, numDuration, joinDate, expiryDate, status, photo, notes, address
          ]
        );
        inserted = true;
        insertResult = result;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('member_id')) {
          // regenerate memberId and retry
          nextNumber += 1;
          memberId = `MB${String(nextNumber).padStart(3, "0")}`;
        } else {
          throw err;
        }
      }
    }
    if (!inserted) {
      throw new Error('Failed to generate unique member_id');
    }

    // create user account for member
    try {
      const pwd = password || phone || '';
      const hashed = pwd ? await bcrypt.hash(pwd, 10) : null;
      await connection.query(
        `INSERT INTO users (email, password_hash, role, username, mobile)
           VALUES (?, ?, ?, ?, ?)`,
        [email || null, hashed, 'user', username || null, phone || null]
      );
    } catch (userErr) {
      if (userErr.code === 'ER_DUP_ENTRY') {
        console.warn('createMember: user already exists, skipping user insert');
      } else {
        console.error('createMember user insert error', userErr);
        throw userErr;
      }
    }

    await connection.commit();

    // fetch back using the richer query so the client sees counts / user_email
    const [fetched] = await connection.query(
      `
      SELECT gm.*,
             u.id AS u_id,
             u.email AS user_email,
             0 AS workout_count,
             0 AS diet_count
      FROM gym_members gm
      LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
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
    console.error('createMember error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
}

async function updateMember(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    const { name, phone, email, gender, height, weight, bmi,
      plan, duration, joinDate, expiryDate, status,
      photo, notes, address, username } = req.body;
    // ensure numeric values are correctly typed
    const numHeight = height != null && !isNaN(height) ? Number(height) : null;
    const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
    const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
    const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

    // Check for duplicate phone if phone is being updated
    if (phone) {
      let dupQuery;
      let dupParams;
      if (isNum) {
        dupQuery = `SELECT * FROM gym_members WHERE phone = ? AND id != ?`;
        dupParams = [phone, idNum];
      } else {
        dupQuery = `SELECT * FROM gym_members WHERE phone = ? AND member_id != ?`;
        dupParams = [phone, id];
      }

      const [existing] = await connection.query(dupQuery, dupParams);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Phone already exists" });
      }
    }

    let updateQuery;
    let updateParams;
    if (isNum) {
      updateQuery = `UPDATE gym_members SET
        name=?, phone=?, email=?, gender=?,
        height=?, weight=?, bmi=?, plan=?, duration=?,
        join_date=?, expiry_date=?, status=?,
        photo=?, notes=?, address=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`;
      updateParams = [
        name, phone, email, gender, numHeight, numWeight, numBmi,
        plan, numDuration, joinDate, expiryDate, status,
        photo, notes, address, idNum
      ];
    } else {
      updateQuery = `UPDATE gym_members SET
        name=?, phone=?, email=?, gender=?,
        height=?, weight=?, bmi=?, plan=?, duration=?,
        join_date=?, expiry_date=?, status=?,
        photo=?, notes=?, address=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE member_id=?`;
      updateParams = [
        name, phone, email, gender, numHeight, numWeight, numBmi,
        plan, numDuration, joinDate, expiryDate, status,
        photo, notes, address, id
      ];
    }

    const [result] = await connection.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member not found' });
    }

    // sync user info (email / mobile / username)
    try {
      const userFields = [];
      const userParams = [];
      if (email !== undefined) {
        userFields.push('email = ?');
        userParams.push(email);
      }
      if (phone !== undefined) {
        userFields.push('mobile = ?');
        userParams.push(phone);
      }
      if (username !== undefined) {
        userFields.push('username = ?');
        userParams.push(username);
      }
      if (userFields.length > 0) {
        const whereClause = [];
        const whereParams = [];
        // identify user by old email or mobile
        if (email) {
          whereClause.push('email = ?');
          whereParams.push(email);
        }
        if (phone) {
          whereClause.push('mobile = ?');
          whereParams.push(phone);
        }
        if (whereClause.length) {
          const updateSql = `UPDATE users SET ${userFields.join(', ')} WHERE ${whereClause.join(' OR ')}`;
          await connection.query(updateSql, [...userParams, ...whereParams]);
        }
      }
    } catch (userErr) {
      console.warn('updateMember: failed to sync user', userErr.message);
      // continue without fatal error
    }

    // Fetch the updated member
    // use the same enhanced lookup as getMemberById so caller receives counts/user_email
    let sql;
    let params;
    if (isNum) {
      sql = `
        SELECT gm.*,
               u.id AS u_id,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        WHERE gm.id = ?
      `;
      params = [idNum];
    } else {
      sql = `
        SELECT gm.*,
               u.id AS u_id,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
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
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    let deleteQuery;
    let deleteParams;
    if (isNum) {
      deleteQuery = `DELETE FROM gym_members WHERE id = ?`;
      deleteParams = [idNum];
    } else {
      deleteQuery = `DELETE FROM gym_members WHERE member_id = ?`;
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
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get member info and their plan
    const sql = `
      SELECT m.membership_plan_id, p.*, m.is_active as member_active
      FROM members m
      LEFT JOIN plans p ON m.membership_plan_id = p.id
      WHERE m.user_id = ?
    `;

    const [rows] = await db.query(sql, [userId]);

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