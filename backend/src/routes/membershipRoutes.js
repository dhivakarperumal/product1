const express = require("express");
const router = express.Router();

const {
  createMembership,
  getUserMemberships,
  getMembershipById,
  deleteMembership,
  getAllMemberships,
  updateMembership,
  getExpiringSoon,
  getTodayRegistrations
} = require("../controllers/membershipController");

/* GET ALL MEMBERSHIPS */
router.get("/", getAllMemberships);

/* GET TODAY NEW MEMBERS */
router.get("/today", getTodayRegistrations);

/* GET EXPIRING SOON ALERTS */
router.get("/alerts/expiring-soon", getExpiringSoon);

/* CREATE MEMBERSHIP */
router.post("/", createMembership);

/* GET USER MEMBERSHIPS */
router.get("/user/:userId", getUserMemberships);

/* GET MEMBERSHIP BY ID */
router.get("/:id", getMembershipById);

/* UPDATE STATUS OR OTHER DETAILS */
router.put("/:id", updateMembership);

// ✅ ADD THIS DELETE ROUTE
router.delete("/:id", deleteMembership);

module.exports = router;