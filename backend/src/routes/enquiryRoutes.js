const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');

// GET /api/enquiries - Get all enquiries
router.get('/', enquiryController.getAllEnquiries);

// GET /api/enquiries/:id - Get enquiry by ID
router.get('/:id', enquiryController.getEnquiryById);

// POST /api/enquiries - Create new enquiry
router.post('/', enquiryController.createEnquiry);

// PUT /api/enquiries/:id/status - Update enquiry status
router.put('/:id/status', enquiryController.updateEnquiryStatus);

// DELETE /api/enquiries/:id - Delete enquiry
router.delete('/:id', enquiryController.deleteEnquiry);

module.exports = router;