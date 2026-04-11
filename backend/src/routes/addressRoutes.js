const express = require("express");

const {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// create address (accepts both root and /add for backwards compatibility)
router.post("/", authenticateToken, createAddress);
router.post("/add", authenticateToken, createAddress);

// get address by user
router.get("/user/:user_id", authenticateToken, getUserAddresses);

// update address
router.put("/:id", updateAddress);

// delete address
router.delete("/:id", deleteAddress);

module.exports = router;