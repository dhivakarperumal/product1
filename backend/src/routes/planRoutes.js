const express = require("express");
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
 * @desc    Get all plans
 */
router.get("/", getAllPlans);

/**
 * @route   GET /api/plans/:id
 * @desc    Get single plan
 */
router.get("/:id", getPlanById);

/**
 * @route   POST /api/plans
 * @desc    Create new plan
 */
router.post("/", createPlan);

/**
 * @route   PUT /api/plans/:id
 * @desc    Update plan
 */
router.put("/:id", updatePlan);

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete plan
 */
router.delete("/:id", deletePlan);

module.exports = router;
