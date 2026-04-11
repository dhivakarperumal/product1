const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');

router.get('/generate-service-id', serviceController.generateServiceId);
router.get('/', authenticateToken, requireAdmin, serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;
