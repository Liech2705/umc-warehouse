const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/workshops
router.get('/', workshopController.getAll);

// GET /api/workshops/:id
router.get('/:id', workshopController.getById);

// POST /api/workshops (Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), workshopController.create);

// PUT /api/workshops/:id (Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), workshopController.update);

// DELETE /api/workshops/:id (Admin)
router.delete('/:id', checkRole('Admin'), workshopController.remove);

module.exports = router;
