const db = require('../config/db');

async function getTrainerTargets(req, res) {
  try {
    const { trainerId } = req.query;
    const params = [];
    let sql = 'SELECT * FROM trainer_targets';

    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;

    const conditions = [];
    if (trainerId) {
      conditions.push('trainer_id = ?');
      params.push(trainerId);
    }

    if (!isSuperAdmin && req.user?.role === 'admin' && adminUuid) {
      conditions.push('admin_uuid = ?');
      params.push(adminUuid);
    }

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY updated_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows.map((row) => {
      const paymentHistory = row.payment_history ? JSON.parse(row.payment_history) : null;
      return {
        ...row,
        days: row.assigned_days,
        amount: row.assigned_amount,
        assignedDays: row.assigned_days,
        assignedAmount: row.assigned_amount,
        paymentHistory,
        payment_history: paymentHistory,
      };
    }));
  } catch (err) {
    console.error('[getTrainerTargets] ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch trainer targets', details: err.message });
  }
}

async function upsertTrainerTarget(req, res) {
  try {
    const {
      trainerId,
      trainerName,
      days,
      amount,
      totalMembershipCollected = 0,
      totalOrderCollected = 0,
      combinedTotal = 0,
      paymentHistory = null,
    } = req.body;

    if (!trainerId || !trainerName || !days || !amount) {
      return res.status(400).json({ error: 'trainerId, trainerName, days, and amount are required' });
    }

    const assignedDays = Number(days);
    const assignedAmount = Number(amount);
    if (!assignedDays || assignedDays < 1) {
      return res.status(400).json({ error: 'Invalid assigned days' });
    }
    if (!assignedAmount || assignedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid assigned amount' });
    }

    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
    const updatedBy = adminUuid;

    const query = `
      INSERT INTO trainer_targets
        (trainer_id, trainer_name, assigned_days, assigned_amount, total_membership_collected,
         total_order_collected, combined_total, payment_history, admin_uuid, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        trainer_name = VALUES(trainer_name),
        assigned_days = VALUES(assigned_days),
        assigned_amount = VALUES(assigned_amount),
        total_membership_collected = VALUES(total_membership_collected),
        total_order_collected = VALUES(total_order_collected),
        combined_total = VALUES(combined_total),
        payment_history = VALUES(payment_history),
        updated_by = VALUES(updated_by),
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      trainerId,
      trainerName,
      assignedDays,
      assignedAmount,
      Number(totalMembershipCollected),
      Number(totalOrderCollected),
      Number(combinedTotal),
      paymentHistory ? JSON.stringify(paymentHistory) : null,
      adminUuid,
      adminUuid,
      updatedBy,
    ];

    await db.query(query, values);

    const [rows] = await db.query('SELECT * FROM trainer_targets WHERE trainer_id = ?', [trainerId]);
    if (rows.length === 0) {
      return res.status(500).json({ error: 'Failed to read back trainer target after save' });
    }

    const saved = rows[0];
    const savedPaymentHistory = saved.payment_history ? JSON.parse(saved.payment_history) : null;
    res.status(201).json({
      ...saved,
      days: saved.assigned_days,
      amount: saved.assigned_amount,
      assignedDays: saved.assigned_days,
      assignedAmount: saved.assigned_amount,
      paymentHistory: savedPaymentHistory,
      payment_history: savedPaymentHistory,
    });
  } catch (err) {
    console.error('[upsertTrainerTarget] ERROR:', err);
    res.status(500).json({ error: 'Failed to save trainer target', details: err.message });
  }
}

module.exports = {
  getTrainerTargets,
  upsertTrainerTarget,
};
