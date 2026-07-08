const express = require('express');
const router = express.Router();
const stockHistoryController = require('../controllers/stockHistoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/stock-history (chỉ Admin, QuanLy)
router.get('/', checkRole('Admin', 'QuanLy'), stockHistoryController.getAll);

module.exports = router;
