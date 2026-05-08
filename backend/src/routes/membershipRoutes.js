const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const {
  createMembership,
  getUserMemberships,
  getMembershipById,
  deleteMembership,
  getAllMemberships,
  updateMembership,
  getExpiringSoon,
  getTodayRegistrations,
  createEMISchedule,
  getEMIPayments,
  getUpcomingEMIPayments,
  updateEMIPayment,
  getEMIStatus
} = require("../controllers/membershipController");

/* GET ALL MEMBERSHIPS */
router.get("/", authenticateToken, requireAdmin, getAllMemberships);

/* GET TODAY NEW MEMBERS */
router.get("/today", getTodayRegistrations);

/* GET EXPIRING SOON ALERTS */
router.get("/alerts/expiring-soon", getExpiringSoon);

/* EMI ROUTES */
router.post("/emi/create-schedule", authenticateToken, requireAdmin, createEMISchedule);
router.get("/emi/upcoming", getUpcomingEMIPayments);
router.get("/emi/status/:membershipId", getEMIStatus);
router.get("/emi/payments/:membershipId", getEMIPayments);
router.put("/emi/payment/:paymentId", authenticateToken, updateEMIPayment);

/* CREATE MEMBERSHIP */
router.post("/", authenticateToken, createMembership);

/* GET USER MEMBERSHIPS */
router.get("/user/:userId", getUserMemberships);

/* GET MEMBERSHIP BY ID */
router.get("/:id", getMembershipById);

/* UPDATE STATUS OR OTHER DETAILS */
router.put("/:id", updateMembership);

/* DELETE MEMBERSHIP */
router.delete("/:id", deleteMembership);

module.exports = router;