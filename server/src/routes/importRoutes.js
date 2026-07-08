const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/imports/export (Xuất Excel phiếu nhập)
router.get('/export', importController.exportExcel);

// GET /api/imports (Lấy danh sách phiếu nhập kho - phân trang & lọc)
router.get('/', importController.getAll);

// GET /api/imports/:id (Lấy chi tiết phiếu nhập kho)
router.get('/:id', importController.getById);

// POST /api/imports (Tạo phiếu nhập kho mới - Chỉ Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), importController.create);

module.exports = router;
