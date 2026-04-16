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
    const {
      userId,
      user_id,
      memberId,
      member_id,
      planId,
      plan_id,
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

    const actualPricePaid = pricePaid !== undefined ? pricePaid : price;
    let resolvedUserId = userId || user_id || null;
    let requestedMemberId = memberId || member_id || null;
    const requestedPlanId = planId || plan_id || null;
    const membersTable = await resolveMemberTable();

    if (!resolvedUserId && !requestedMemberId) {
      return res.status(400).json({ success: false, message: "userId or memberId is required to create membership" });
    }

    let resolvedMemberId = null;
    let resolvedMemberExternalId = null;
    let resolvedMemberName = null;
    let resolvedMemberEmail = null;
    let resolvedMemberPhone = null;

    if (resolvedUserId) {
      const [validUser] = await db.query(
        "SELECT id FROM users WHERE id = ?",
        [resolvedUserId]
      );
      if (validUser.length === 0) {
        const [memberRow] = await db.query(
          `SELECT id, member_id, name, email, phone FROM ${membersTable} WHERE id = ? OR member_id = ?`,
          [resolvedUserId, resolvedUserId]
        );
        if (memberRow.length > 0) {
          requestedMemberId = resolvedUserId;
          resolvedMemberId = memberRow[0].id;
          resolvedMemberExternalId = memberRow[0].member_id || null;
          resolvedMemberName = memberRow[0].name || null;
          resolvedMemberEmail = memberRow[0].email || null;
          resolvedMemberPhone = memberRow[0].phone || null;
          resolvedUserId = null;
        } else {
          return res.status(400).json({ success: false, message: "Invalid userId for membership" });
        }
      }
    }

    if (requestedMemberId && !resolvedMemberId) {
      const [validMember] = await db.query(
        `SELECT id, member_id, name, email, phone FROM ${membersTable} WHERE id = ? OR member_id = ?`,
        [requestedMemberId, requestedMemberId]
      );
      if (validMember.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid memberId for membership" });
      }
      resolvedMemberId = validMember[0].id;
      resolvedMemberExternalId = validMember[0].member_id || null;
      resolvedMemberName = validMember[0].name || null;
      resolvedMemberEmail = validMember[0].email || null;
      resolvedMemberPhone = validMember[0].phone || null;
    }

    if (!requestedPlanId) {
      return res.status(400).json({ success: false, message: "planId or plan_id is required to create membership" });
    }

    let resolvedPlanExternalId = null;
    let resolvedPlanInternalId = null;
    let resolvedPlanName = planName || null;
    const [validPlan] = await db.query(
      "SELECT id, plan_id, name FROM gym_plans WHERE id = ? OR plan_id = ?",
      [requestedPlanId, requestedPlanId]
    );
    if (validPlan.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid planId for membership" });
    }
    resolvedPlanInternalId = validPlan[0].id;
    resolvedPlanExternalId = validPlan[0].plan_id || null;
    resolvedPlanName = resolvedPlanName || validPlan[0].name || null;

    let finalUserId = resolvedUserId;
    if (resolvedUserId) {
      const [validUser] = await db.query(
        "SELECT id FROM users WHERE id = ?",
        [resolvedUserId]
      );
      if (validUser.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid userId for membership" });
      }
    } else if (resolvedMemberId) {
      const [linkedUser] = await db.query(
        "SELECT id FROM users WHERE email = ? OR mobile = ? LIMIT 1",
        [resolvedMemberEmail, resolvedMemberPhone]
      );
      if (linkedUser.length > 0) {
        finalUserId = linkedUser[0].id;
      }
    }

    // Get audit trail data (created_by and updated_by with admin UUID)
    const auditTrail = createAuditTrail(req.user);

    const query = `
      INSERT INTO memberships
      (userId, memberId, member_id, member_name, member_email, planId, plan_id, planName, pricePaid, duration, startDate, endDate, paymentId, paymentMode, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      finalUserId,
      resolvedMemberId,
      resolvedMemberExternalId,
      resolvedMemberName,
      resolvedMemberEmail,
      resolvedPlanInternalId,
      resolvedPlanExternalId,
      resolvedPlanName,
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

    const [result] = await db.query(query, values);

    res.status(201).json({
      success: true,
      membershipId: result.insertId,
    });

  } catch (error) {
    console.error("Create membership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create membership",
    });
  }
}

/* ================= GET USER MEMBERSHIPS ================= */

async function getUserMemberships(req, res) {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM memberships WHERE userId = ? OR memberId = ? ORDER BY createdAt DESC",
      [userId, userId]
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