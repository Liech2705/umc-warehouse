const {
  Warehouse,
  Location,
  ImportReceipt,
  ExportReceipt,
  Inventory,
  StockHistory,
  InventoryCheck,
  DefectiveItem,
} = require('../models');

// [GET] /api/warehouses
exports.getAll = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.findAll({
      order: [['warehouse_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: warehouses,
      message: 'Lấy danh sách kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/warehouses/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Kho không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: warehouse,
      message: 'Lấy thông tin kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/warehouses
exports.create = async (req, res, next) => {
  try {
    const { warehouse_name, location } = req.body;

    if (!warehouse_name || warehouse_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho không được để trống.',
      });
    }

    const existingWarehouse = await Warehouse.findOne({
      where: { warehouse_name: warehouse_name.trim() },
    });

    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Tên kho này đã tồn tại trên hệ thống.',
      });
    }

    const newWarehouse = await Warehouse.create({
      warehouse_name: warehouse_name.trim(),
      location: location ? location.trim() : null,
    });

    return res.status(201).json({
      success: true,
      data: newWarehouse,
      message: 'Tạo kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/warehouses/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouse_name, location } = req.body;

    if (!warehouse_name || warehouse_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho không được để trống.',
      });
    }

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Kho không tồn tại để cập nhật.',
      });
    }

    const duplicateWarehouse = await Warehouse.findOne({
      where: { warehouse_name: warehouse_name.trim() },
    });

    if (duplicateWarehouse && duplicateWarehouse.warehouse_id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Tên kho này đã được sử dụng bởi kho khác.',
      });
    }

    warehouse.warehouse_name = warehouse_name.trim();
    warehouse.location = location ? location.trim() : null;

    await warehouse.save();

    return res.status(200).json({
      success: true,
      data: warehouse,
      message: 'Cập nhật kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/warehouses/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Kho không tồn tại trên hệ thống.',
      });
    }

    // Kiểm tra tất cả các liên kết ngoại quan trọng
    const whereWarehouse = { where: { warehouse_id: id } };

    const checks = await Promise.all([
      Location.findOne(whereWarehouse),
      ImportReceipt.findOne(whereWarehouse),
      ExportReceipt.findOne(whereWarehouse),
      Inventory.findOne(whereWarehouse),
      StockHistory.findOne(whereWarehouse),
      InventoryCheck.findOne(whereWarehouse),
      DefectiveItem.findOne(whereWarehouse),
    ]);

    // Nếu bất kỳ liên kết nào tồn tại
    if (checks.some((r) => r !== null)) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa vì đang có dữ liệu liên quan (vị trí/phiếu nhập/phiếu xuất/tồn kho/hàng lỗi) liên kết với kho này.',
      });
    }

    await warehouse.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};
