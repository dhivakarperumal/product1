const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
} = require('../controllers/userController');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user role
 */
router.put('/:id', updateUserRole);

module.exports = router;
