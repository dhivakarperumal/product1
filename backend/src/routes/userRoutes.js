const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
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

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 */
router.delete('/:id', deleteUser);

module.exports = router;
