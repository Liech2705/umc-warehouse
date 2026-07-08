const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

// Apply authentication to all routes
router.use(authMiddleware);

// Only Admins can access user management routes
router.use(checkRole('Admin'));

// GET /api/users - Get all users
router.get('/', userController.getAll);

// POST /api/users - Create new user
router.post('/', userController.create);

// PUT /api/users/:id - Update user info (full_name, role, status)
router.put('/:id', userController.update);

// PUT /api/users/:id/reset-password - Reset user password
router.put('/:id/reset-password', userController.resetPassword);

// DELETE /api/users/:id - Soft-delete (lock) user
router.delete('/:id', userController.remove);

module.exports = router;
