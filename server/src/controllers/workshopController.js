const { Workshop, ImportReceipt, ExportReceipt, DefectiveItem } = require('../models');

// [GET] /api/workshops
exports.getAll = async (req, res, next) => {
  try {
    const workshops = await Workshop.findAll({
      order: [['workshop_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: workshops,
      message: 'Lấy danh sách xưởng sản xuất thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/workshops/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshop = await Workshop.findByPk(id);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Xưởng sản xuất không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: workshop,
      message: 'Lấy thông tin xưởng sản xuất thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/workshops
exports.create = async (req, res, next) => {
  try {
    const { workshop_name, manager_name } = req.body;

    if (!workshop_name || workshop_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên xưởng sản xuất không được để trống.',
      });
    }

    const existingWorkshop = await Workshop.findOne({
      where: { workshop_name: workshop_name.trim() },
    });

    if (existingWorkshop) {
      return res.status(400).json({
        success: false,
        message: 'Tên xưởng sản xuất này đã tồn tại trên hệ thống.',
      });
    }

    const newWorkshop = await Workshop.create({
      workshop_name: workshop_name.trim(),
      manager_name: manager_name ? manager_name.trim() : null,
    });

    return res.status(201).json({
      success: true,
      data: newWorkshop,
      message: 'Tạo xưởng sản xuất thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/workshops/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workshop_name, manager_name } = req.body;

    if (!workshop_name || workshop_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên xưởng sản xuất không được để trống.',
      });
    }

    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Xưởng sản xuất không tồn tại để cập nhật.',
      });
    }

    const duplicateWorkshop = await Workshop.findOne({
      where: { workshop_name: workshop_name.trim() },
    });

    if (duplicateWorkshop && duplicateWorkshop.workshop_id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Tên xưởng sản xuất này đã được sử dụng bởi xưởng khác.',
      });
    }

    workshop.workshop_name = workshop_name.trim();
    workshop.manager_name = manager_name ? manager_name.trim() : null;

    await workshop.save();

    return res.status(200).json({
      success: true,
      data: workshop,
      message: 'Cập nhật xưởng sản xuất thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/workshops/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Xưởng sản xuất không tồn tại trên hệ thống.',
      });
    }

    const whereWorkshop = { where: { workshop_id: id } };

    // Kiểm tra các liên kết quan trọng
    const checks = await Promise.all([
      ImportReceipt.findOne(whereWorkshop),
      ExportReceipt.findOne(whereWorkshop),
      DefectiveItem.findOne(whereWorkshop),
    ]);

    if (checks.some((r) => r !== null)) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa vì đang có dữ liệu liên kết (phiếu nhập/phiếu xuất/hàng lỗi) liên quan đến xưởng sản xuất này.',
      });
    }

    await workshop.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa xưởng sản xuất thành công.',
    });
  } catch (error) {
    next(error);
  }
};
