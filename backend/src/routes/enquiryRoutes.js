const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/enquiries - Get all enquiries (admin only)
router.get('/', authenticateToken, enquiryController.getAllEnquiries);

// GET /api/enquiries/:id - Get enquiry by ID (admin only)
router.get('/:id', authenticateToken, enquiryController.getEnquiryById);

// POST /api/enquiries - Create new enquiry (admin auth required to track creator)
router.post('/', authenticateToken, enquiryController.createEnquiry);

// PUT /api/enquiries/:id/status - Update enquiry status (admin auth required)
router.put('/:id/status', authenticateToken, enquiryController.updateEnquiryStatus);

// DELETE /api/enquiries/:id - Delete enquiry (admin auth required)
router.delete('/:id', authenticateToken, enquiryController.deleteEnquiry);

module.exports = router;