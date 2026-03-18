const db = require('../config/db');

async function getAllEquipment(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM gym_equipment ORDER BY created_at DESC'
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

    const [result] = await db.query(
      `INSERT INTO gym_equipment 
       (name, category, purchase_date, \`condition\`, status, service_due_month, under_warranty, under_maintenance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, purchaseDate, condition || 'Good', status || 'available', serviceDueMonth || null, underWarranty ? 1 : 0, underMaintenance ? 1 : 0]
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

    const [result] = await db.query(
      `UPDATE gym_equipment 
       SET name = ?, category = ?, purchase_date = ?, \`condition\` = ?, 
           status = ?, service_due_month = ?, under_warranty = ?, 
           under_maintenance = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, purchaseDate, condition, status, serviceDueMonth, underWarranty ? 1 : 0, underMaintenance ? 1 : 0, idNum]
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
