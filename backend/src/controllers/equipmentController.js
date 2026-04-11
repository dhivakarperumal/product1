const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

async function getAllEquipment(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let whereClause = '';
    let params = [];
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        whereClause = ' WHERE created_by = ?';
        params.push(adminUuid);
      }
    }

    const [rows] = await db.query(
      `SELECT * FROM gym_equipment ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllEquipment error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getEquipmentById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
    const [rows] = await db.query(
      `SELECT * FROM gym_equipment WHERE id = ?`,
      [idNum]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getEquipmentById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createEquipment(req, res) {
  try {
    const {
      name,
      category,
      purchaseDate,
      condition,
      status,
      serviceDueMonth,
      underWarranty,
      underMaintenance
    } = req.body;

    if (!name || !category || !purchaseDate) {
      return res.status(400).json({ message: "Name, category, and purchase date are required" });
    }

    const createdBy = getActorUuid(req.user) || null;

    const [result] = await db.query(
      `INSERT INTO gym_equipment 
       (name, category, purchase_date, \`condition\`, status, service_due_month, under_warranty, under_maintenance, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, purchaseDate, condition || 'Good', status || 'available', serviceDueMonth || null, underWarranty ? 1 : 0, underMaintenance ? 1 : 0, createdBy, createdBy]
    );

    // Fetch the created equipment
    const [rows] = await db.query('SELECT * FROM gym_equipment WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createEquipment error', err);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
}

async function updateEquipment(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
    const {
      name,
      category,
      purchaseDate,
      condition,
      status,
      serviceDueMonth,
      underWarranty,
      underMaintenance
    } = req.body;

    const updatedBy = getActorUuid(req.user) || null;

    const [result] = await db.query(
      `UPDATE gym_equipment 
       SET name = ?, category = ?, purchase_date = ?, \`condition\` = ?, 
           status = ?, service_due_month = ?, under_warranty = ?, 
           under_maintenance = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, purchaseDate, condition, status, serviceDueMonth, underWarranty ? 1 : 0, underMaintenance ? 1 : 0, updatedBy, idNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Fetch the updated equipment
    const [rows] = await db.query('SELECT * FROM gym_equipment WHERE id = ?', [idNum]);
    res.json(rows[0]);
  } catch (err) {
    console.error('updateEquipment error', err);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
}

async function deleteEquipment(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    const [result] = await db.query(
      'DELETE FROM gym_equipment WHERE id = ?',
      [idNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    console.error('deleteEquipment error', err);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
}

async function getEquipmentByStatus(req, res) {
  try {
    const { status } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM gym_equipment WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    res.json(rows);
  } catch (err) {
    console.error('getEquipmentByStatus error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentByStatus
};
