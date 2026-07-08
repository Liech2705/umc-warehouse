const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public route
router.post('/login', authController.login);

// Protected route
router.get('/me', authMiddleware, authController.me);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
