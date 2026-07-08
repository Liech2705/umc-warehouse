const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/products (Lấy danh sách có phân trang + filter)
router.get('/', productController.getAll);

// GET /api/products/:id (Lấy chi tiết)
router.get('/:id', productController.getById);

// GET /api/products/:id/stock-history (Lịch sử biến động của 1 sản phẩm)
const inventoryController = require('../controllers/inventoryController');
router.get('/:id/stock-history', inventoryController.getProductStockHistory);

// POST /api/products (Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), productController.create);

// PUT /api/products/:id (Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), productController.update);

// DELETE /api/products/:id (Admin)
router.delete('/:id', checkRole('Admin'), productController.remove);

module.exports = router;
