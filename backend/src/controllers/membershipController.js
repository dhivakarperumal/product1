const db = require('../config/db');
const { getActorUuid, createAuditTrail, updateAuditTrail } = require('../utils/auditTrail');

// Extract admin UUID from request user (fallback for compatibility)
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

// Resolve members table name (could be 'members' or 'gym_members')
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

/* ================= GET ALL MEMBERSHIPS ================= */
async function getAllMemberships(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let whereClause = '';
    let params = [];
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        whereClause = ' WHERE m.created_by = ?';
        params.push(adminUuid);
      }
    }

    const [rows] = await db.query(`
      SELECT m.*, 
             u.username, 
             u.email AS user_email, 
             u.mobile AS user_mobile, 
             u.role,
             gm.name AS member_name,
             gm.phone AS member_phone,
             gm.email AS member_email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN members gm ON m.memberId = gm.id
      ${whereClause}
      ORDER BY m.createdAt DESC
    `, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching all memberships:", error);
    res.status(500).json({ error: "Failed to fetch memberships" });
  }
}

/* ================= DELETE MEMBERSHIP ================= */

async function deleteMembership(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM memberships WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    res.json({
      success: true,
      message: "Membership deleted successfully",
    });

  } catch (error) {
    console.error("Delete membership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete membership",
    });
  }
}

/* ================= CREATE MEMBERSHIP ================= */

async function createMembership(req, res) {
  try {
    const membersTable = await resolveMemberTable();

    const {
      userId,
      planId,
      planName,
      pricePaid,
      price,
      duration,
      startDate,
      endDate,
      paymentId,
      paymentMode,
      status,
    } = req.body;

    // Validate required fields - accept integer ID and fetch the UUID
    if ((!userId && !memberId) || !planId || !startDate || !endDate) {
      console.error('Missing required fields:', { userId, memberId, planId, startDate, endDate });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: (userId OR memberId), planId, startDate, endDate",
      });
    }

    let member_uuid = null;
    let plan_uuid = null;

    // Fetch member_id (UUID) from members table using the integer id
    if (memberId || userId) {
      const membId = memberId || userId;
      const selectQuery = `SELECT id, member_id FROM ${membersTable} WHERE id = ? LIMIT 1`;
      const [memberRows] = await db.query(selectQuery, [membId]);
      
      if (memberRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Member with ID ${membId} does not exist in ${membersTable}`,
        });
      }
      member_uuid = memberRows[0].member_id;
      console.log('Fetched member_id (UUID):', member_uuid, 'from table:', membersTable);
    }

    // Fetch plan_id (UUID) from gym_plans table using the integer id
    if (planId) {
      const [planRows] = await db.query(
        'SELECT id, plan_id FROM gym_plans WHERE id = ? LIMIT 1',
        [planId]
      );
      
      if (planRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Plan with ID ${planId} does not exist`,
        });
      }
      plan_uuid = planRows[0].plan_id;
      console.log('Fetched plan_id (UUID):', plan_uuid);
    }

    const actualPricePaid = pricePaid !== undefined ? pricePaid : price;
    const resolvedUserId = userId || null;
    const resolvedMemberId = memberId || null;

    if (!resolvedUserId && !resolvedMemberId) {
      return res.status(400).json({ success: false, message: "userId or memberId is required to create membership" });
    }

    if (resolvedUserId) {
      const [validUser] = await db.query(
        "SELECT id FROM users WHERE id = ?",
        [resolvedUserId]
      );
      if (validUser.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid userId for membership" });
      }
    }

    if (resolvedMemberId) {
      const [validMember] = await db.query(
        "SELECT id FROM members WHERE id = ?",
        [resolvedMemberId]
      );
      if (validMember.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid memberId for membership" });
      }
    }

    // Get audit trail data (created_by and updated_by with admin UUID)
    const auditTrail = createAuditTrail(req.user);

    const query = `
      INSERT INTO memberships
      (userId, planId, planName, pricePaid, duration, startDate, endDate, paymentId, paymentMode, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      planId,
      planName,
      actualPricePaid,
      duration,
      startDate,
      endDate,
      paymentId || null,
      paymentMode || null,
      status || 'active',
      auditTrail.created_by,
      auditTrail.updated_by,
    ];

      console.log('Creating membership with UUID values:');
      console.log('  userId column = member_id (UUID):', member_uuid);
      console.log('  planId column = plan_id (UUID):', plan_uuid);
      console.log('  All values:', values);
      
      [result] = await db.query(query, values);
      
    } catch (insertErr) {
      // If column type is wrong, provide helpful error
      if (insertErr.code === 'ER_TRUNCATED_WRONG_VALUE' || 
          insertErr.code === 'ER_DATA_TOO_LONG' ||
          insertErr.sqlMessage?.includes('Data truncated')) {
        console.error('Column type mismatch - userId/planId columns may still be INT instead of CHAR(36)');
        console.error('Error:', insertErr.sqlMessage);
        return res.status(500).json({
          success: false,
          message: 'Database schema needs update. Run migration 0059 to convert userId/planId columns to CHAR(36).',
          error: insertErr.message
        });
      }
      throw insertErr;
    }

    res.status(201).json({
      success: true,
      membershipId: result.insertId,
    });

  } catch (error) {
    console.error("Create membership error:", error.message, error.code, error.sqlMessage);
    
    // Handle specific MySQL errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID or member ID. Plan or member does not exist.",
        error: error.message
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "This membership combination already exists.",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create membership",
      error: error.message,
      code: error.code
    });
  }
}

/* ================= GET USER MEMBERSHIPS ================= */

async function getUserMemberships(req, res) {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM memberships WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    );

    res.json(rows);

  } catch (error) {
    console.error("Fetch memberships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch memberships",
    });
  }
}

/* ================= GET MEMBERSHIP BY ID ================= */

async function getMembershipById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM memberships WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Membership not found",
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Fetch membership error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
}

/* ================= UPDATE MEMBERSHIP ================= */
async function updateMembership(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get audit trail data (updated_by with admin UUID)
    const auditTrail = updateAuditTrail(req.user);

    const [result] = await db.query(
      "UPDATE memberships SET status = ?, updated_by = ? WHERE id = ?",
      [status, auditTrail.updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    res.json({ success: true, message: "Membership updated successfully" });
  } catch (error) {
    console.error("Update membership error:", error);
    res.status(500).json({ success: false, message: "Failed to update membership" });
  }
}

/* ================= GET EXPIRING SOON ================= */
async function getExpiringSoon(req, res) {
  try {
    console.log('getExpiringSoon called with query', req.query);
    const { trainerUserId } = req.query;
    let staffId = null;

    if (trainerUserId) {
      const [userRows] = await db.query(
        'SELECT email, username FROM users WHERE id = ?',
        [trainerUserId]
      );
      if (userRows.length > 0) {
        const u = userRows[0];
        const [staffRows] = await db.query(
          'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
          [u.email, u.username]
        );
        if (staffRows.length > 0) staffId = staffRows[0].id;
      }
    }

    let sql = `
      SELECT m.*, 
             u.username, 
             u.email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
    `;
    
    if (staffId) {
      sql += ` INNER JOIN trainer_assignments ta ON ta.user_id = m.userId AND ta.trainer_id = ? `;
    }

    // Add filter: expiring in next 5 days
    sql += ` WHERE m.status = 'active' 
             AND m.endDate >= CURDATE() 
             AND m.endDate <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
             ORDER BY m.endDate ASC `;

    const [rows] = await db.query(sql, staffId ? [staffId] : []);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching expiring memberships:", error);
    console.error(error.stack || error);
    res.status(500).json({ error: "Failed to fetch alerts", details: error.message });
  }
}

/* ================= GET TODAY REGISTRATIONS ================= */
async function getTodayRegistrations(req, res) {
  try {
    console.log('getTodayRegistrations called');
    const [rows] = await db.query(`
      SELECT m.*, 
             u.username, 
             u.email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      WHERE DATE(m.createdAt) = CURDATE()
      ORDER BY m.createdAt DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching today's registrations:", error);
    console.error(error.stack || error);
    res.status(500).json({ error: "Failed to fetch registrations", details: error.message });
  }
}

module.exports = {
  createMembership,
  getUserMemberships,
  getMembershipById,
  getAllMemberships,
  getExpiringSoon,
  getTodayRegistrations, // Added
  updateMembership,
  deleteMembership,
};