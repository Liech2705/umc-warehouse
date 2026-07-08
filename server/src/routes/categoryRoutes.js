const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

// Tất cả các route trong categories đều yêu cầu đăng nhập
router.use(authMiddleware);

// GET /api/categories (Lấy tất cả nhóm hàng)
router.get('/', categoryController.getAll);

// GET /api/categories/:id (Lấy chi tiết nhóm hàng)
router.get('/:id', categoryController.getById);

// POST /api/categories (Tạo mới nhóm hàng - chỉ Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), categoryController.create);

// PUT /api/categories/:id (Cập nhật nhóm hàng - chỉ Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), categoryController.update);

// DELETE /api/categories/:id (Xóa nhóm hàng - chỉ Admin)
router.delete('/:id', checkRole('Admin'), categoryController.remove);

module.exports = router;
