const express = require("express");
const { authenticateToken, requireAdmin, optionalAuthenticateToken } = require("../middleware/auth");
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require("../controllers/planController.js");

const router = express.Router();

/**
 * @route   GET /api/plans
 * @desc    Get all plans (admins see all, members see filtered by created_by)
 */
router.get("/", authenticateToken, getAllPlans);

/**
 * @route   GET /api/plans/:id
 * @desc    Get single plan
 */
router.get("/:id", optionalAuthenticateToken, getPlanById);

/**
 * @route   POST /api/plans
 * @desc    Create new plan
 */
router.post("/", authenticateToken, requireAdmin, createPlan);

/**
 * @route   PUT /api/plans/:id
 * @desc    Update plan
 */
router.put("/:id", authenticateToken, requireAdmin, updatePlan);

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete plan
 */
router.delete("/:id", authenticateToken, requireAdmin, deletePlan);

module.exports = router;
