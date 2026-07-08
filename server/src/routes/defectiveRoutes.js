const express = require('express');
const router = express.Router();
const defectiveController = require('../controllers/defectiveController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/defective-items/export (Xuất Excel hàng lỗi)
router.get('/export', defectiveController.exportExcel);

// GET /api/defective-items (Lấy danh sách hàng lỗi)
router.get('/', defectiveController.getAll);

// POST /api/defective-items (Báo cáo lỗi mới - Mọi role đã login)
router.post('/', defectiveController.create);

// POST /api/defective-items/:id/scrap (Phê duyệt hủy bỏ hàng lỗi - Chỉ Admin, QuanLy)
router.post('/:id/scrap', checkRole('Admin', 'QuanLy'), defectiveController.scrap);

// PUT /api/defective-items/:id/return-to-supplier (Đổi trạng thái thành Trả NCC - Admin, ThuKho, QuanLy)
router.put(
  '/:id/return-to-supplier',
  checkRole('Admin', 'ThuKho', 'QuanLy'),
  defectiveController.returnToSupplier
);

module.exports = router;
