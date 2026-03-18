const db = require('../config/db');

// Helper function to parse JSON fields
const parseProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    weight: typeof product.weight === 'string' ? JSON.parse(product.weight || '[]') : (product.weight || []),
    size: typeof product.size === 'string' ? JSON.parse(product.size || '[]') : (product.size || []),
    gender: typeof product.gender === 'string' ? JSON.parse(product.gender || '[]') : (product.gender || []),
    images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []),
    stock: typeof product.stock === 'string' ? JSON.parse(product.stock || '{}') : (product.stock || {})
  };
};

async function createProduct(req, res) {
  try {
    const {
      name, category, subcategory, description, ratings,
      weight, size, gender, mrp, offer, offerPrice, stock, images
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products
      (name, category, subcategory, description, ratings, weight, size, gender,
       mrp, offer, offer_price, stock, images)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name, category, subcategory, description, ratings,
        JSON.stringify(weight || []), JSON.stringify(size || []), JSON.stringify(gender || []), 
        mrp, offer, offerPrice, JSON.stringify(stock || {}), JSON.stringify(images || [])
      ]
    );

    // Fetch the created product
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ error: 'Insert failed' });
  }
}

async function listProducts(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
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
    
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('getProduct error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
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
    
    const data = req.body;
    const allowedFields = ['name', 'category', 'subcategory', 'description', 'ratings', 'weight', 'size', 'gender', 'mrp', 'offer', 'offer_price', 'offerPrice', 'stock', 'images'];
    const fields = [];
    const values = [];
    
    for (const key in data) {
      if (!allowedFields.includes(key)) {
        console.warn(`updateProduct: ignoring disallowed field '${key}'`);
        continue;
      }
      
      // Normalize offerPrice -> offer_price for DB
      const dbKey = key === 'offerPrice' ? 'offer_price' : key;
      
      // For JSON fields, stringify them
      if (['weight', 'size', 'gender', 'images', 'stock'].includes(dbKey)) {
        fields.push(`\`${dbKey}\` = ?`);
        values.push(JSON.stringify(data[key] || {}));
      } else {
        fields.push(`\`${dbKey}\` = ?`);
        values.push(data[key]);
      }
    }
    
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    
    values.push(idNum);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    console.log('updateProduct query:', query, 'values:', values);
    
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Fetch the updated product
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('updateProduct error', err, 'body:', req.body);
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
}

async function getLowStockAlerts(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    const parsed = rows.map(parseProduct);
    
    // Logic: if total sum of all stock variants < 5 or any variant < 5
    const lowStock = parsed.filter(p => {
      if (typeof p.stock === 'object' && !Array.isArray(p.stock) && Object.keys(p.stock).length > 0) {
        const values = Object.values(p.stock).map(v => parseInt(v) || 0);
        const total = values.reduce((acc, val) => acc + val, 0);
        return total < 5 || values.some(v => v < 5);
      }
      return false;
    });

    res.json(lowStock.slice(0, 10)); // Limit to most urgent 10
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
  getLowStockAlerts 
};
