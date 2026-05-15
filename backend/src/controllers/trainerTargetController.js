const db = require('../config/db');

async function getTrainerTargets(req, res) {
  try {
    const { trainerId } = req.query;
    const params = [];
    let sql = 'SELECT * FROM trainer_targets';

    const userRole = String(req.user?.role || '').toLowerCase();
    const isSuperAdmin = userRole === 'super admin';
    const isAdmin = userRole === 'admin' || isSuperAdmin;
    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
    const userId = req.user?.id || req.user?.userId || req.user?.user_id || req.user?.employee_id || req.user?.employeeId;

    const conditions = [];

    // If trainerId is provided in query, use it (for trainer viewing their own targets or admin viewing specific trainer)
    if (trainerId) {
      conditions.push('trainer_id = ?');
      params.push(trainerId);
    } else if (!isAdmin && userId) {
      // If not admin and no trainerId provided, trainer can only see their own targets
      conditions.push('trainer_id = ?');
      params.push(userId);
    }

    // If admin (but not super admin), filter by their admin UUID
    if (!isSuperAdmin && isAdmin && adminUuid) {
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

    // Security check: trainers can only create targets for themselves
    const userRole = String(req.user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin';
    const userId = req.user?.id || req.user?.userId || req.user?.user_id || req.user?.employee_id || req.user?.employeeId;
    
    if (!isAdmin && userId && String(trainerId) !== String(userId)) {
      return res.status(403).json({ error: 'You can only create targets for yourself' });
    }

    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || req.user?.userUuid || req.user?.user_uuid || null;
    const updatedBy = adminUuid || userId;

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
      adminUuid || null,
      updatedBy,
      updatedBy,
    ];

    await db.query(query, values);

    const [rows] = await db.query('SELECT * FROM trainer_targets WHERE trainer_id = ? ORDER BY created_at DESC LIMIT 1', [trainerId]);
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

async function updateTrainerTarget(req, res) {
  try {
    const { id } = req.params;
    const { is_completed, isCompleted, total_collected, totalCollected, ...updateFields } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Target ID is required' });
    }

    // Security check: trainers can only update their own targets
    const userRole = String(req.user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin';
    const userId = req.user?.id || req.user?.userId || req.user?.user_id || req.user?.employee_id || req.user?.employeeId;

    // Get the target to verify ownership
    const [targetRows] = await db.query('SELECT * FROM trainer_targets WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const target = targetRows[0];
    if (!isAdmin && String(target.trainer_id) !== String(userId)) {
      return res.status(403).json({ error: 'You can only update your own targets' });
    }

    // Build update query
    const completedFlag = is_completed !== undefined ? is_completed : isCompleted;
    const collected = total_collected !== undefined ? total_collected : totalCollected;

    const setClauses = [];
    const values = [];

    if (completedFlag !== undefined) {
      setClauses.push('is_completed = ?');
      values.push(completedFlag ? 1 : 0);
    }

    if (collected !== undefined) {
      setClauses.push('combined_total = ?');
      values.push(Number(collected));
    }

    // Add any other fields from updateFields
    Object.keys(updateFields).forEach((key) => {
      setClauses.push(`${key} = ?`);
      values.push(updateFields[key]);
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE trainer_targets SET ${setClauses.join(', ')} WHERE id = ?`;
    await db.query(query, values);

    // Fetch and return updated record
    const [updatedRows] = await db.query('SELECT * FROM trainer_targets WHERE id = ?', [id]);
    if (updatedRows.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch updated target' });
    }

    const updated = updatedRows[0];
    const paymentHistory = updated.payment_history ? JSON.parse(updated.payment_history) : null;
    res.json({
      ...updated,
      days: updated.assigned_days,
      amount: updated.assigned_amount,
      assignedDays: updated.assigned_days,
      assignedAmount: updated.assigned_amount,
      paymentHistory,
      payment_history: paymentHistory,
    });
  } catch (err) {
    console.error('[updateTrainerTarget] ERROR:', err);
    res.status(500).json({ error: 'Failed to update trainer target', details: err.message });
  }
}

module.exports = {
  getTrainerTargets,
  upsertTrainerTarget,
  updateTrainerTarget,
};
