const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// normalize trainer/member/user actor UUID from request

// helper to parse JSON columns
function parseDiet(row) {
  if (!row) return row;
  return {
    ...row,
    days: typeof row.days === 'string' ? JSON.parse(row.days || '{}') : row.days,
  };
}

function getDietExpiry(diet) {
  const createdAt = new Date(diet.created_at || diet.createdAt || null);
  if (Number.isNaN(createdAt.getTime())) return null;
  const days = Number(diet.duration || diet.duration_days || diet.durationDays || 1) || 1;
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}

function isNumeric(value) {
  return (typeof value === 'number' && Number.isFinite(value) && value > 0) || (/^[1-9]\d*$/.test(String(value || '').trim()));
}

async function resolveTrainerDetails(trainerId, trainerName) {
  if (!trainerId) return { trainerUuid: null, trainerName };
  const requested = String(trainerId || '').trim();
  if (!requested || requested === '0') {
    return { trainerUuid: null, trainerName };
  }
  if (isNumeric(requested)) {
    const [staffRows] = await db.query(
      'SELECT id, employee_id, name FROM staff WHERE id = ? OR employee_id = ? LIMIT 1',
      [requested, requested]
    );
    if (staffRows.length === 0) {
      return { trainerUuid: requested, trainerName };
    }
    const staff = staffRows[0];
    return { trainerUuid: staff.employee_id || String(staff.id), trainerName: trainerName || staff.name || null };
  }
  return { trainerUuid: requested, trainerName };
}

async function resolveMemberDetails(memberId, memberName, memberEmail, memberMobile, userId = null) {
  const requested = String(memberId || '').trim();
  const normalizedUserId = userId && String(userId).trim() !== '0' ? String(userId).trim() : null;

  if (!requested && !normalizedUserId) {
    return { memberUuid: null, memberName, memberEmail, memberMobile, userId: null };
  }

  if (requested && requested !== '0') {
    const [memberRows] = await db.query(
      'SELECT id, member_id, name, email, phone FROM members WHERE id = ? OR member_id = ? LIMIT 1',
      [requested, requested]
    );

    if (memberRows.length > 0) {
      const member = memberRows[0];
      return {
        memberUuid: member.member_id || String(member.id),
        memberName: memberName || member.name || null,
        memberEmail: memberEmail || member.email || null,
        memberMobile: memberMobile || member.phone || null,
        userId: member.id,
      };
    }

    const [gymRows] = await db.query(
      'SELECT id, member_id, name, email, phone FROM gym_members WHERE id = ? OR member_id = ? LIMIT 1',
      [requested, requested]
    );

    if (gymRows.length > 0) {
      const gymMember = gymRows[0];
      return {
        memberUuid: gymMember.member_id || String(gymMember.id),
        memberName: memberName || gymMember.name || null,
        memberEmail: memberEmail || gymMember.email || null,
        memberMobile: memberMobile || gymMember.phone || null,
        userId: null,
      };
    }

      if (isNumeric(requested)) {
      const [membershipRows] = await db.query(
        'SELECT memberId, userId FROM memberships WHERE id = ? LIMIT 1',
        [requested]
      );
      if (membershipRows.length > 0) {
        const membership = membershipRows[0];
        if (membership.memberId) {
          const [memberRowsByMemberId] = await db.query(
            'SELECT id, member_id, name, email, phone FROM members WHERE id = ? OR member_id = ? LIMIT 1',
            [membership.memberId, membership.memberId]
          );
          if (memberRowsByMemberId.length > 0) {
            const member = memberRowsByMemberId[0];
            return {
              memberUuid: member.member_id || String(member.id),
              memberName: memberName || member.name || null,
              memberEmail: memberEmail || member.email || null,
              memberMobile: memberMobile || member.phone || null,
              userId: member.id,
            };
          }
        }
        if (membership.userId) {
          return {
            memberUuid: null,
            memberName,
            memberEmail,
            memberMobile,
            userId: membership.userId,
          };
        }
      }

      // If numeric id didn't match any membership/member rows, fall back to using
      // the numeric value as a member UUID (compatibility with older data shapes).
      // Previously this threw an error which resulted in 500 responses during bulk
      // creation flows when front-end provided membership IDs. Prefer graceful
      // handling and allow the insert to proceed or be rejected by validation.
      return { memberUuid: requested, memberName, memberEmail, memberMobile, userId: userId || null };
    }

    return { memberUuid: requested, memberName, memberEmail, memberMobile, userId: userId || null };
  }

  return {
    memberUuid: null,
    memberName,
    memberEmail,
    memberMobile,
    userId: normalizedUserId || null,
  };
}

async function getAllDiets(req, res) {
  try {
    let sql = 'SELECT * FROM diet_plans WHERE 1=1';
    const params = [];

    const userRole = String(req.user?.role || '').toLowerCase();

    // Check if user is super admin
    const isSuperAdmin = userRole === 'super admin';

    // If super admin, show all
    if (isSuperAdmin) {
      // No filter for super admin
    }
    // If requester is admin, filter by admin_uuid or admin_id
    else if (userRole === 'admin') {
      const adminUuid = getActorUuid(req.user);
      if (adminUuid) {
        sql += ' AND (created_by = ? OR admin_id = ?)';
        params.push(adminUuid, req.user.userId);
      } else {
        sql += ' AND admin_id = ?';
        params.push(req.user.userId);
      }
    }
    // If requester is a member, show only diets assigned to them
    else if (userRole === 'user' || userRole === 'member') {
      const requestUserId = req.user?.id || req.user?.userId || req.user?.user_id || null;
      const userEmail = req.user?.email || '';
      const userPhone = req.user?.phone || req.user?.mobile || '';

      const [memberRows] = await db.query(
        'SELECT id, member_id FROM members WHERE email = ? OR phone = ? LIMIT 1',
        [userEmail, userPhone]
      );

      if (memberRows.length > 0) {
        const member = memberRows[0];
        const memberIdValue = member.id;
        const memberUuidValue = member.member_id || member.id;

        sql += ' AND (member_id = ? OR member_id = ?';
        params.push(memberIdValue, memberUuidValue);

        if (requestUserId) {
          sql += ' OR user_id = ?';
          params.push(requestUserId);
        }

        sql += ')';
      } else if (requestUserId) {
        sql += ' AND (user_id = ? OR member_id = ?)';
        params.push(requestUserId, requestUserId);
      } else {
        sql += ' AND 0';
      }
    }

    if (req.query.trainerId) {
      const requestedTrainer = String(req.query.trainerId).trim();
      if (isNumeric(requestedTrainer)) {
        sql += ' AND (trainer_id = ? OR trainer_id = (SELECT employee_id FROM staff WHERE id = ? LIMIT 1))';
        params.push(requestedTrainer, requestedTrainer);
      } else {
        sql += ' AND trainer_id = ?';
        params.push(requestedTrainer);
      }
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows.map(parseDiet));
  } catch (err) {
    console.error('getAllDiets error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getDietById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('getDietById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createDiet(req, res) {
  try {
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    const adminId = req.user?.role === 'admin' ? req.user.userId : null;

    const trainerDetails = await resolveTrainerDetails(trainerId || null, trainerName);
    const memberDetails = await resolveMemberDetails(memberId || null, memberName, memberEmail, memberMobile, userId || req.body.user_id || null);

    if (trainerDetails.trainerUuid === '0') {
      trainerDetails.trainerUuid = null;
    }
    if (memberDetails.memberUuid === '0') {
      memberDetails.memberUuid = null;
    }
    if (memberDetails.userId === 0 || memberDetails.userId === '0') {
      memberDetails.userId = null;
    }

    if (!memberDetails.memberUuid && !memberDetails.userId) {
      return res.status(400).json({ error: 'Missing valid member or user identifier for diet plan' });
    }

    const activeConditions = [];
    const activeParams = [];
    if (memberDetails.memberUuid) {
      activeConditions.push('member_id = ?');
      activeParams.push(memberDetails.memberUuid);
    }
    if (memberDetails.userId) {
      activeConditions.push('user_id = ?');
      activeParams.push(memberDetails.userId);
    }

    if (activeConditions.length > 0) {
      const [existingRows] = await db.query(
        `SELECT * FROM diet_plans WHERE (${activeConditions.join(' OR ')}) AND status = 'active'`,
        activeParams
      );
      const now = Date.now();
      for (const diet of existingRows) {
        const expiry = getDietExpiry(diet);
        if (expiry && expiry.getTime() > now) {
          return res.status(400).json({
            error: 'This member already has an active diet plan. Add a new diet plan only after the current duration completes.',
          });
        }
      }
    }

    const auditActor = trainerDetails.trainerUuid || getActorUuid(req.user) || null;

    const [result] = await db.query(
      `INSERT INTO diet_plans
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile, member_weight,
       title, total_calories, duration, days, status, user_id, admin_id, created_by, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerDetails.trainerUuid,
        trainerDetails.trainerName || null,
        trainerSource || null,
        memberDetails.memberUuid,
        memberDetails.memberName || null,
        memberDetails.memberEmail || null,
        memberDetails.memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberDetails.userId || null,
        adminId,
        auditActor,
        auditActor,
      ]
    );

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [result.insertId]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('createDiet error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateDiet(req, res) {
  try {
    const { id } = req.params;
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    // Resolve trainer and member details
    const trainerDetails = await resolveTrainerDetails(trainerId || null, trainerName);
    const memberDetails = await resolveMemberDetails(memberId || null, memberName, memberEmail, memberMobile, userId || req.body.user_id || null);

    const updatedBy = trainerDetails.trainerUuid || getActorUuid(req.user) || null;

    const [result] = await db.query(
      `UPDATE diet_plans SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?, member_weight=?,
        title=?, total_calories=?, duration=?, days=?, status=?, user_id=?,
        updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerDetails.trainerUuid,
        trainerDetails.trainerName || null,
        trainerSource || null,
        memberDetails.memberUuid,
        memberDetails.memberName || null,
        memberDetails.memberEmail || null,
        memberDetails.memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberDetails.userId || null,
        updatedBy,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('updateDiet error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteDiet(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM diet_plans WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteDiet error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
};