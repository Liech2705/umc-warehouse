const express = require('express');
const router = express.Router();
const defectiveController = require('../controllers/defectiveController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/reports/defective-summary (Lấy thống kê hàng lỗi)
router.get('/defective-summary', defectiveController.getSummary);

module.exports = router;
