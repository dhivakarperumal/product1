const db = require('../config/db');
const axios = require('axios');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

/**
 * Send EMI payment reminder notifications
 */
async function sendEMIReminders(req, res) {
  try {
    const { daysAhead = 3, reminderType = 'upcoming' } = req.body;

    let query = `
      SELECT ep.*, m.*, gm.name AS member_name, gm.email AS member_email, gm.phone AS member_phone
      FROM emi_payments ep
      JOIN memberships m ON ep.membershipId = m.id
      LEFT JOIN members gm ON m.memberId = gm.id
      WHERE ep.status = 'pending'
    `;

    if (reminderType === 'upcoming') {
      query += ` AND ep.dueDate >= CURDATE() AND ep.dueDate <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`;
    } else if (reminderType === 'overdue') {
      query += ` AND ep.dueDate < CURDATE()`;
    }

    const params = reminderType === 'upcoming' ? [daysAhead] : [];
    const [payments] = await db.query(query, params);

    const results = {
      total: payments.length,
      sent: 0,
      failed: 0,
      details: []
    };

    for (const payment of payments) {
      try {
        // Send WhatsApp notification
        if (payment.member_phone) {
          await sendWhatsAppEMIReminder(payment, reminderType);
          results.sent++;
        }

        // Log notification
        results.details.push({
          paymentId: payment.id,
          memberName: payment.member_name,
          phone: payment.member_phone,
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: 'sent'
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          paymentId: payment.id,
          memberName: payment.member_name,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({ success: true, ...results });

  } catch (error) {
    console.error("Send EMI reminders error:", error);
    res.status(500).json({ success: false, message: "Failed to send reminders" });
  }
}

/**
 * Send WhatsApp EMI reminder
 */
async function sendWhatsAppEMIReminder(payment, reminderType = 'upcoming') {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    
    let message = '';
    if (reminderType === 'overdue') {
      message = `Hi ${payment.member_name},\n\nYour EMI payment (Installment #${payment.installmentNumber}) of ₹${payment.amount.toFixed(2)} was due on ${payment.dueDate}.\n\nPlease make the payment at your earliest convenience.\n\nThank you!`;
    } else {
      const daysLeft = Math.ceil((new Date(payment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      message = `Hi ${payment.member_name},\n\nReminder: Your EMI payment (Installment #${payment.installmentNumber}) of ₹${payment.amount.toFixed(2)} is due on ${payment.dueDate} (in ${daysLeft} days).\n\nPlease arrange the payment.\n\nThank you!`;
    }

    // Send via WhatsApp API
    const response = await axios.post(`${baseUrl}/whatsapp/send-message`, {
      phone: payment.member_phone,
      message: message
    }, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to send WhatsApp reminder for payment ${payment.id}:`, error.message);
    throw error;
  }
}

/**
 * Get EMI notification statistics
 */
async function getEMINotificationStats(req, res) {
  try {
    // Get upcoming payments in next 7 days
    const [upcoming] = await db.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM emi_payments
      WHERE status = 'pending'
      AND dueDate >= CURDATE()
      AND dueDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    // Get overdue payments
    const [overdue] = await db.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM emi_payments
      WHERE status = 'pending'
      AND dueDate < CURDATE()
    `);

    // Get completed payments this month
    const [completed] = await db.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM emi_payments
      WHERE status = 'completed'
      AND MONTH(paidDate) = MONTH(NOW())
      AND YEAR(paidDate) = YEAR(NOW())
    `);

    res.json({
      success: true,
      upcoming: upcoming[0] || { count: 0, total: 0 },
      overdue: overdue[0] || { count: 0, total: 0 },
      completed: completed[0] || { count: 0, total: 0 }
    });

  } catch (error) {
    console.error("Get EMI stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}

/**
 * Mark multiple EMI payments as paid
 */
async function markEMIPaymentsPaid(req, res) {
  try {
    const { paymentIds, paymentMethod = 'admin-marked' } = req.body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ success: false, message: "paymentIds array required" });
    }

    const placeholders = paymentIds.map(() => '?').join(',');
    const [result] = await db.query(
      `UPDATE emi_payments 
       SET status = 'completed', 
           paymentMethod = ?, 
           paidDate = CURDATE(),
           updatedAt = NOW()
       WHERE id IN (${placeholders})`,
      [paymentMethod, ...paymentIds]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} payments marked as paid`
    });

  } catch (error) {
    console.error("Mark EMI payments paid error:", error);
    res.status(500).json({ success: false, message: "Failed to update payments" });
  }
}

/**
 * Auto-mark overdue EMI payments
 */
async function markOverdueEMI(req, res) {
  try {
    const { daysOverdue = 1 } = req.body;

    const [result] = await db.query(
      `UPDATE emi_payments 
       SET status = 'overdue',
           updatedAt = NOW()
       WHERE status = 'pending'
       AND dueDate < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [daysOverdue]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} payments marked as overdue`
    });

  } catch (error) {
    console.error("Mark overdue EMI error:", error);
    res.status(500).json({ success: false, message: "Failed to mark overdue" });
  }
}

module.exports = {
  sendEMIReminders,
  getEMINotificationStats,
  markEMIPaymentsPaid,
  markOverdueEMI
};
