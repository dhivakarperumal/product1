const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

const safeJsonParse = (value, fallback) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
  return value ?? fallback;
};

// Helper function to parse JSON fields
const parseProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    weight: safeJsonParse(product.weight, []),
    size: safeJsonParse(product.size, []),
    gender: safeJsonParse(product.gender, []),
    images: safeJsonParse(product.images, []),
    stock: safeJsonParse(product.stock, {})
  };
};

const buildProductFilter = (user) => {
  if (!user) {
    return { sql: ' WHERE 1=0', params: [] };
  }

  if (user.role === 'super admin') {
    return { sql: '', params: [] };
  }

  const adminUuid = getActorUuid(user);
  if (adminUuid) {
    return { sql: ' WHERE created_by = ?', params: [adminUuid] };
  }

  return { sql: ' WHERE 1=0', params: [] };
};

async function createProduct(req, res) {
  try {
    const {
      name, category, subcategory, description, ratings,
      weight, size, gender, mrp, offer, offerPrice, stock, images
    } = req.body;

    const createdBy = getActorUuid(req.user);

    const [result] = await db.query(
      `INSERT INTO products
      (name, category, subcategory, description, ratings, weight, size, gender,
       mrp, offer, offer_price, stock, images, created_by, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name,
        category,
        subcategory,
        description,
        ratings,
        JSON.stringify(weight || []),
        JSON.stringify(size || []),
        JSON.stringify(gender || []),
        mrp,
        offer,
        offerPrice,
        JSON.stringify(stock || {}),
        JSON.stringify(images || []),
        createdBy,
        createdBy,
      ]
    );

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(parseProduct(rows[0]));
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ error: 'Insert failed' });
  }
}

async function listProducts(req, res) {
  try {
    const user = req.user;
    const { sql, params } = buildProductFilter(user);
    const [rows] = await db.query(`SELECT * FROM products${sql} ORDER BY id DESC`, params);
    res.json(rows.map(parseProduct));
  } catch (err) {
    console.error('listProducts error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const user = req.user;

    let query = 'SELECT * FROM products WHERE id = ?';
    const queryParams = [idNum];

    if (user && user.role !== 'super admin') {
      const adminUuid = getActorUuid(user);
      if (!adminUuid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      query += ' AND created_by = ?';
      queryParams.push(adminUuid);
    }

    const [rows] = await db.query(query, queryParams);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('getProduct error', err);
    res.status(500).json({
      error: 'Query failed',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (user.role !== 'super admin') {
      const adminUuid = getActorUuid(user);
      if (!adminUuid || existing[0].created_by !== adminUuid) {
        return res.status(403).json({ error: 'Not authorized to delete this product' });
      }
    }

    await db.query('DELETE FROM products WHERE id = ?', [idNum]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteProduct error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (user.role !== 'super admin') {
      const adminUuid = getActorUuid(user);
      if (!adminUuid || existing[0].created_by !== adminUuid) {
        return res.status(403).json({ error: 'Not authorized to update this product' });
      }
    }

    const data = req.body;
    const allowedFields = ['name', 'category', 'subcategory', 'description', 'ratings', 'weight', 'size', 'gender', 'mrp', 'offer', 'offer_price', 'offerPrice', 'stock', 'images'];
    const fields = [];
    const values = [];

    for (const key in data) {
      if (!allowedFields.includes(key)) {
        console.warn(`updateProduct: ignoring disallowed field '${key}'`);
        continue;
      }

      const dbKey = key === 'offerPrice' ? 'offer_price' : key;

      if (['weight', 'size', 'gender', 'images', 'stock'].includes(dbKey)) {
        fields.push(`\`${dbKey}\` = ?`);
        values.push(JSON.stringify(data[key] || {}));
      } else {
        fields.push(`\`${dbKey}\` = ?`);
        values.push(data[key]);
      }
    }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    fields.push('updated_by = ?');
    values.push(getActorUuid(req.user));
    values.push(idNum);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('updateProduct error', err, 'body:', req.body);
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
}

async function getLowStockAlerts(req, res) {
  try {
    const user = req.user;
    const { sql, params } = buildProductFilter(user);
    const [rows] = await db.query(`SELECT * FROM products${sql}`, params);
    const parsed = rows.map(parseProduct);

    const lowStock = parsed.filter(p => {
      if (typeof p.stock === 'object' && !Array.isArray(p.stock) && Object.keys(p.stock).length > 0) {
        const values = Object.values(p.stock).map(v => parseInt(v) || 0);
        const total = values.reduce((acc, val) => acc + val, 0);
        return total < 5 || values.some(v => v < 5);
      }
      return false;
    });

    res.json(lowStock.slice(0, 10));
  } catch (err) {
    console.error('getLowStockAlerts error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  getLowStockAlerts,
};
