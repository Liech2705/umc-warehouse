const express = require('express');
const router = express.Router();
const inventoryCheckController = require('../controllers/inventoryCheckController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/inventory-checks (Lấy danh sách phiếu kiểm kê)
router.get('/', inventoryCheckController.getAllChecks);

// GET /api/inventory-checks/:id (Chi tiết phiếu kiểm kê)
router.get('/:id', inventoryCheckController.getCheckById);

// POST /api/inventory-checks (Tạo phiếu kiểm kê mới - Chỉ Admin, ThuKho, QuanLy)
router.post('/', checkRole('Admin', 'ThuKho', 'QuanLy'), inventoryCheckController.createCheck);

// PUT /api/inventory-checks/:id/details (Cập nhật số lượng kiểm đếm thực tế - Cho phép Nhân viên, Thủ kho, Quản lý, Admin)
router.put('/:id/details', inventoryCheckController.updateDetails);

// POST /api/inventory-checks/:id/confirm (Xác nhận đối chiếu và điều chỉnh tồn kho - Chỉ Admin, QuanLy)
router.post('/:id/confirm', checkRole('Admin', 'QuanLy'), inventoryCheckController.confirmCheck);

module.exports = router;
