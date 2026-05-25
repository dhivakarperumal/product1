const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticateToken, requireTrainerOrAdmin, requireAdmin } = require('../middleware/auth');

// GET /api/enquiries - Get all enquiries (admin or trainer access - read only)
router.get('/', authenticateToken, requireTrainerOrAdmin, enquiryController.getAllEnquiries);

// GET /api/enquiries/:id - Get enquiry by ID (admin or trainer access - read only)
router.get('/:id', authenticateToken, requireTrainerOrAdmin, enquiryController.getEnquiryById);

// POST /api/enquiries - Create new enquiry (admin or trainer)
router.post('/', authenticateToken, requireTrainerOrAdmin, enquiryController.createEnquiry);

// PUT /api/enquiries/:id - Update enquiry details (admin or trainer)
router.put('/:id', authenticateToken, requireTrainerOrAdmin, enquiryController.updateEnquiry);

// PUT /api/enquiries/:id/status - Update enquiry status (trainer or admin)
router.put('/:id/status', authenticateToken, requireTrainerOrAdmin, enquiryController.updateEnquiryStatus);

// DELETE /api/enquiries/:id - Delete enquiry (admin only)
router.delete('/:id', authenticateToken, requireAdmin, enquiryController.deleteEnquiry);

module.exports = router;