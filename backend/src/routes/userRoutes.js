const express = require('express');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Create new user
 */
router.post('/', authenticateToken, requireAdmin, createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users
 */
router.get('/', authenticateToken, requireAdmin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 */
router.get('/:id', authenticateToken, requireAdmin, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user role
 */
router.put('/:id', authenticateToken, requireAdmin, updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

module.exports = router;
