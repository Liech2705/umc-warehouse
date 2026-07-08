const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/inventory/export (Xuất Excel tồn kho)
router.get('/export', inventoryController.exportExcel);

// GET /api/inventory (Lấy danh sách tồn kho realtime)
router.get('/', inventoryController.getInventory);

module.exports = router;
