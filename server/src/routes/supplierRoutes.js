const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/suppliers
router.get('/', supplierController.getAll);

// GET /api/suppliers/:id
router.get('/:id', supplierController.getById);

// POST /api/suppliers (Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), supplierController.create);

// PUT /api/suppliers/:id (Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), supplierController.update);

// DELETE /api/suppliers/:id (Admin)
router.delete('/:id', checkRole('Admin'), supplierController.remove);

module.exports = router;
