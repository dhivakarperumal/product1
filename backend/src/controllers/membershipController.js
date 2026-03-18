const db = require('../config/db');

/* ================= GET ALL MEMBERSHIPS ================= */
async function getAllMemberships(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email, 
             COALESCE(m.userPhone, u.mobile) as mobile, 
             u.role
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      ORDER BY m.createdAt DESC
    `);
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
      userName,
      userEmail,
      userPhone,
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

    const actualPricePaid = pricePaid !== undefined ? pricePaid : price;

    const query = `
      INSERT INTO memberships
      (userId, userName, userEmail, userPhone, planId, planName, pricePaid, duration, startDate, endDate, paymentId, paymentMode, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      userName || null,
      userEmail || null,
      userPhone || null,
      planId,
      planName,
      actualPricePaid,
      duration,
      startDate,
      endDate,
      paymentId || null,
      paymentMode || null,
      status || 'active',
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

    const [result] = await db.query(
      "UPDATE memberships SET status = ? WHERE id = ?",
      [status, id]
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
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email
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
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}

/* ================= GET TODAY REGISTRATIONS ================= */
async function getTodayRegistrations(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      WHERE DATE(m.createdAt) = CURDATE()
      ORDER BY m.createdAt DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching today's registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
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