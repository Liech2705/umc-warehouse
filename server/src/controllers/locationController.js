const { Location, Warehouse, Inventory } = require('../models');

// [GET] /api/locations (Lấy danh sách vị trí, có filter theo warehouse_id, JOIN warehouse_name)
exports.getAll = async (req, res, next) => {
  try {
    const { warehouse_id } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    const locations = await Location.findAll({
      where: whereClause,
      include: [
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
      ],
      order: [
        ['warehouse_id', 'ASC'],
        ['location_code', 'ASC'],
      ],
    });

    return res.status(200).json({
      success: true,
      data: locations,
      message: 'Lấy danh sách vị trí kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/locations/:id (Chi tiết vị trí)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id, {
      include: [
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
      ],
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Vị trí kho không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: location,
      message: 'Lấy thông tin vị trí kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/locations (Tạo mới vị trí)
exports.create = async (req, res, next) => {
  try {
    const { warehouse_id, location_code, description } = req.body;

    // Validate bắt buộc
    if (!warehouse_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn kho hàng.' });
    }
    if (!location_code || location_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mã vị trí không được để trống.' });
    }

    // Kiểm tra kho hàng tồn tại
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      return res.status(400).json({ success: false, message: 'Kho hàng được chọn không tồn tại.' });
    }

    // Kiểm tra trùng mã vị trí TRONG CÙNG MỘT KHO
    const existingLocation = await Location.findOne({
      where: {
        location_code: location_code.trim(),
        warehouse_id,
      },
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Mã vị trí này đã tồn tại trong kho được chọn.',
      });
    }

    const newLocation = await Location.create({
      warehouse_id,
      location_code: location_code.trim(),
      description: description ? description.trim() : null,
    });

    // Load lại kèm tên kho
    const responseData = await Location.findByPk(newLocation.location_id, {
      include: [{ model: Warehouse, attributes: ['warehouse_name'] }],
    });

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Tạo vị trí kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/locations/:id (Cập nhật vị trí)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouse_id, location_code, description } = req.body;

    // Validate bắt buộc
    if (!warehouse_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn kho hàng.' });
    }
    if (!location_code || location_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mã vị trí không được để trống.' });
    }

    const location = await Location.findByPk(id);
    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: 'Vị trí kho không tồn tại để cập nhật.' });
    }

    // Kiểm tra kho hàng mới tồn tại
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      return res.status(400).json({ success: false, message: 'Kho hàng được chọn không tồn tại.' });
    }

    // Kiểm tra trùng mã vị trí TRONG CÙNG MỘT KHO (ngoại trừ chính nó)
    const duplicateLocation = await Location.findOne({
      where: {
        location_code: location_code.trim(),
        warehouse_id,
      },
    });

    if (duplicateLocation && duplicateLocation.location_id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã vị trí này đã tồn tại trong kho được chọn.',
      });
    }

    location.warehouse_id = warehouse_id;
    location.location_code = location_code.trim();
    location.description = description ? description.trim() : null;

    await location.save();

    // Load lại kèm tên kho
    const responseData = await Location.findByPk(location.location_id, {
      include: [{ model: Warehouse, attributes: ['warehouse_name'] }],
    });

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Cập nhật vị trí kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/locations/:id (Xóa vị trí)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Vị trí kho không tồn tại trên hệ thống.',
      });
    }

    // Chặn xóa nếu có sản phẩm tồn kho tham chiếu tới vị trí này
    const linkedInventory = await Inventory.findOne({
      where: { location_id: id },
    });

    if (linkedInventory) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa vì đang có sản phẩm tồn kho đặt tại vị trí này.',
      });
    }

    await location.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa vị trí kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};
