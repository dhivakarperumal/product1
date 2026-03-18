const db = require('../config/db');

function normalize(row) {
  const item = {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    variant: row.variant,
    quantity: row.quantity,
    price: row.price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // prefer stored snapshot values if present, otherwise fall back to join
  if (row.product_name) item.name = row.product_name;
  // if join returned a name and snapshot doesn't exist, use it
  if (!item.name && row.product_name_join) item.name = row.product_name_join;

  if (row.product_images) {
    try {
      item.images = JSON.parse(row.product_images);
    } catch {}
  }
  if (!item.images && row.product_image) {
    // allow storing single image string
    try {
      item.images = JSON.parse(row.product_image);
    } catch {
      item.image = row.product_image;
    }
  }

  // when variant is composed of size-gender, split into separate props for easier UI
  if (row.variant && typeof row.variant === 'string') {
    const parts = row.variant.split('-');
    if (parts.length === 2) {
      item.size = parts[0] || null;
      item.gender = parts[1] || null;
    }
    // if weight-oriented variant (e.g. food), keep as weight
    if (row.variant && parts.length === 1) {
      item.weight = row.variant;
    }
  }

  return item;
}

async function listCart(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const [rows] = await db.query(
      `SELECT c.*, p.name as product_name_join, p.images as product_images
       FROM cart_items c
       LEFT JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    const out = rows.map((row) => {
      const item = normalize(row);
      if (row.product_name) item.name = row.product_name;
      if (row.product_images) {
        try {
          item.images = JSON.parse(row.product_images);
        } catch {}
      }
      return item;
    });
    res.json(out);
  } catch (err) {
    console.error('listCart error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

// POST upsert
async function addToCart(req, res) {
  try {
    console.log('addToCart body', req.body);
    const {
      userId,
      productId,
      variant,
      quantity,
      price,
      productName,
      productImage,
    } = req.body || {};
    if (!userId || !productId) {
      const msg = 'userId and productId required';
      console.warn('addToCart validation failed:', msg, req.body);
      return res.status(400).json({ error: msg });
    }
    const qty = quantity || 1;
    const pr = Number(price) || 0;
    const v = variant || null;
    const pName = productName || null;
    const pImage = productImage || null;

    const sql = `
      INSERT INTO cart_items (user_id, product_id, variant, quantity, price, product_name, product_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity),
        price = VALUES(price),
        product_name = VALUES(product_name),
        product_image = VALUES(product_image),
        updated_at = CURRENT_TIMESTAMP
    `;
    const params = [userId, productId, v, qty, pr, pName, pImage];
    await db.query(sql, params);

    // return updated list
    const [rows] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    res.json(rows.map(normalize));
  } catch (err) {
    console.error('addToCart error', err, 'body', req.body);
    res.status(500).json({ error: 'Insert failed', detail: err.message });
  }
}

async function updateCartItem(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!quantity) return res.status(400).json({ error: 'quantity required' });
    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const [rows] = await db.query('SELECT * FROM cart_items WHERE id = ?', [id]);
    res.json(normalize(rows[0]));
  } catch (err) {
    console.error('updateCartItem error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

async function removeCartItem(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM cart_items WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('removeCartItem error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  listCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
