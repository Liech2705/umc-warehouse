const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/warehouses
router.get('/', warehouseController.getAll);

// GET /api/warehouses/:id
router.get('/:id', warehouseController.getById);

// POST /api/warehouses (Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), warehouseController.create);

// PUT /api/warehouses/:id (Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), warehouseController.update);

// DELETE /api/warehouses/:id (Admin)
router.delete('/:id', checkRole('Admin'), warehouseController.remove);

module.exports = router;
