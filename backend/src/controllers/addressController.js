const db = require("../config/db");

// CREATE ADDRESS
const createAddress = async (req, res) => {
  try {
    const {
      user_id,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Check if address already exists (avoid duplicates)
    const [existing] = await db.query(
      `SELECT * FROM user_addresses WHERE user_id = ? AND address = ? AND phone = ?`,
      [user_id, address, phone]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({ 
        error: "exists",
        message: "This address already exists for this user" 
      });
    }

    const [result] = await db.query(
      `INSERT INTO user_addresses
        (user_id, name, email, phone, address, city, state, zip, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, name, email, phone, address, city, state, zip, country || "India"]
    );

    res.status(201).json({
      success: true,
      message: "Address saved successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Create address error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// GET USER ADDRESSES
const getUserAddresses = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const [result] = await db.query(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );

    res.json(result || []);
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// UPDATE ADDRESS
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
    } = req.body;

    const [result] = await db.query(
      `UPDATE user_addresses
        SET name=?, email=?, phone=?, address=?, city=?, state=?, zip=?, country=?
        WHERE id = ?`,
      [name, email, phone, address, city, state, zip, country || "India", id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    res.json({ success: true, message: "Address updated" });
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM user_addresses WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({
      success: true,
      message: "Address deleted",
    });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

module.exports = {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
};