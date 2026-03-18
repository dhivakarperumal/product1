const db = require('../config/db');

// Helper to safely parse JSON
const safeParsePoints = (pointsStr) => {
  try {
    return pointsStr ? JSON.parse(pointsStr) : [];
  } catch (err) {
    console.warn('Failed to parse points:', err.message);
    return [];
  }
};

async function generateServiceId(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [select] = await connection.query("SELECT current FROM counters WHERE name = ? FOR UPDATE", ['services']);
    
    if (select.length === 0) {
      await connection.query("INSERT INTO counters(name, current) VALUES (?, ?)", ['services', 1]);
      await connection.commit();
      return res.json({ serviceId: `SE${String(1).padStart(3, '0')}` });
    }

    const current = select[0].current || 0;
    const next = current + 1;
    await connection.query('UPDATE counters SET current = ? WHERE name = ?', [next, 'services']);
    await connection.commit();
    return res.json({ serviceId: `SE${String(next).padStart(3, '0')}` });
  } catch (err) {
    await connection.rollback();
    console.error('generateServiceId error', err);
    res.status(500).json({ error: 'Failed to generate service id' });
  } finally {
    connection.release();
  }
}

async function getAllServices(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    const services = rows.map(r => ({
      id: r.id,
      service_id: r.service_id,
      title: r.title,
      slug: r.slug,
      short_desc: r.short_desc,
      description: r.description,
      heroImage: r.hero_image,    // normalize to camelCase for frontend
      points: safeParsePoints(r.points),
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    res.json(services);
  } catch (err) {
    console.error('getAllServices error:', err.message);
    res.status(500).json({ error: 'Query failed: ' + err.message });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT * FROM services WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT * FROM services WHERE service_id = ? OR slug = ?`;
      params = [id, id];
    }
    
    const [rows] = await db.query(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const row = rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(service);
  } catch (err) {
    console.error('getServiceById error:', err.message);
    res.status(500).json({ error: 'Query failed: ' + err.message });
  }
}

async function createService(req, res) {
  try {
    const body = req.body;
    const pointsJson = JSON.stringify(body.points || []);

    const [result] = await db.query(
      `INSERT INTO services (service_id, title, slug, short_desc, description, hero_image, points)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [body.service_id || null, body.title, body.slug, body.short_desc, body.description || null, body.hero_image || null, pointsJson]
    );

    // Fetch the created service
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    if (rows.length === 0) return res.status(500).json({ error: 'Failed to create service' });
    
    const row = rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.status(201).json(service);
  } catch (err) {
    console.error('createService error:', err.message);
    res.status(500).json({ error: 'Failed to create service: ' + err.message });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    const pointsJson = JSON.stringify(body.points || []);
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    let query;
    let params;
    if (isNum) {
      query = `UPDATE services SET title = ?, slug = ?, short_desc = ?, description = ?, hero_image = ?, points = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`;
      params = [body.title, body.slug, body.short_desc, body.description || null, body.hero_image || null, pointsJson, idNum];
    } else {
      query = `UPDATE services SET title = ?, slug = ?, short_desc = ?, description = ?, hero_image = ?, points = ?, updated_at = CURRENT_TIMESTAMP
       WHERE service_id = ?`;
      params = [body.title, body.slug, body.short_desc, body.description || null, body.hero_image || null, pointsJson, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Service not found' });

    // Fetch the updated service
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = 'SELECT * FROM services WHERE id = ?';
      fetchParams = [idNum];
    } else {
      fetchQuery = 'SELECT * FROM services WHERE service_id = ?';
      fetchParams = [id];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    
    const row = rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(service);
  } catch (err) {
    console.error('updateService error:', err.message);
    res.status(500).json({ error: 'Failed to update service: ' + err.message });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `DELETE FROM services WHERE id = ?`;
      params = [idNum];
    } else {
      query = `DELETE FROM services WHERE service_id = ?`;
      params = [id];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('deleteService error:', err.message);
    res.status(500).json({ error: 'Failed to delete service: ' + err.message });
  }
}

module.exports = {
  generateServiceId,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
