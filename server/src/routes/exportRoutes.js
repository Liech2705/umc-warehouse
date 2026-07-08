const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/exports/export (Xuất Excel phiếu xuất)
router.get('/export', exportController.exportExcel);

// GET /api/exports (Lấy danh sách phiếu xuất kho - phân trang & lọc)
router.get('/', exportController.getAll);

// GET /api/exports/:id (Lấy chi tiết phiếu xuất kho)
router.get('/:id', exportController.getById);

// POST /api/exports (Tạo phiếu xuất kho mới - Chỉ Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), exportController.create);

module.exports = router;
