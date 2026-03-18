const db = require('../config/db');

async function getAllReviews(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllReviews error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getReviewById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    const [rows] = await db.query(
      'SELECT * FROM reviews WHERE id = ?',
      [idNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('getReviewById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createReview(req, res) {
  try {
    const { name, rating, message, image, status } = req.body;

    if (!name || !rating) {
      return res.status(400).json({ error: 'Name and rating are required' });
    }

    const [result] = await db.query(
      `INSERT INTO reviews (name, rating, message, image, status)
       VALUES (?, ?, ?, ?, ?)`,
      [name, Number(rating), message || '', image || '', status ? 1 : 0]
    );

    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createReview error', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const { name, rating, message, image, status } = req.body;

    const [result] = await db.query(
      `UPDATE reviews 
       SET name = ?, rating = ?, message = ?, image = ?, status = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name || null, rating ? Number(rating) : null, message || '', image || '', status ? 1 : 0, idNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [idNum]);
    res.json(rows[0]);
  } catch (err) {
    console.error('updateReview error', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
}

async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    const [result] = await db.query(
      'DELETE FROM reviews WHERE id = ?',
      [idNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('deleteReview error', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
