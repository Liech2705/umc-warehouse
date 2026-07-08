const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/dashboard/summary (Tổng hợp thống kê trang chủ)
router.get('/summary', dashboardController.getSummary);

module.exports = router;
