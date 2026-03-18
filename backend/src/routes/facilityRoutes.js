const express = require("express");
const {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  toggleFacilityActive,
} = require("../controllers/facilityController.js");

const router = express.Router();

/**
 * @route   GET /api/facilities
 * @desc    Get all facilities
 */
router.get("/", getAllFacilities);

/**
 * @route   GET /api/facilities/:id
 * @desc    Get single facility
 */
router.get("/:id", getFacilityById);

/**
 * @route   POST /api/facilities
 * @desc    Create new facility
 */
router.post("/", createFacility);

/**
 * @route   PUT /api/facilities/:id
 * @desc    Update facility (requires full payload)
 */
router.put("/:id", updateFacility);

/**
 * @route   PATCH /api/facilities/:id/active
 * @desc    Toggle active flag only
 */
router.patch("/:id/active", toggleFacilityActive);

/**
 * @route   DELETE /api/facilities/:id
 * @desc    Delete facility
 */
router.delete("/:id", deleteFacility);

module.exports = router;
