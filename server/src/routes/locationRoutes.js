const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

router.use(authMiddleware);

// GET /api/locations
router.get('/', locationController.getAll);

// GET /api/locations/:id
router.get('/:id', locationController.getById);

// POST /api/locations (Admin, ThuKho)
router.post('/', checkRole('Admin', 'ThuKho'), locationController.create);

// PUT /api/locations/:id (Admin, ThuKho)
router.put('/:id', checkRole('Admin', 'ThuKho'), locationController.update);

// DELETE /api/locations/:id (Admin)
router.delete('/:id', checkRole('Admin'), locationController.remove);

module.exports = router;
