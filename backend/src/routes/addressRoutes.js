const express = require("express");

const {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");

const router = express.Router();

// create address (accepts both root and /add for backwards compatibility)
router.post("/", createAddress);
router.post("/add", createAddress);

// get address by user
router.get("/user/:user_id", getUserAddresses);

// update address
router.put("/:id", updateAddress);

// delete address
router.delete("/:id", deleteAddress);

module.exports = router;