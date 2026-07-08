const { Category, Product } = require('../models');

// [GET] /api/categories (Lấy danh sách nhóm hàng)
exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['category_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Lấy danh sách nhóm hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/categories/:id (Chi tiết nhóm hàng)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Nhóm hàng không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
      message: 'Lấy thông tin nhóm hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/categories (Tạo mới nhóm hàng)
exports.create = async (req, res, next) => {
  try {
    const { category_name } = req.body;

    // Validate rỗng
    if (!category_name || category_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm hàng không được để trống.',
      });
    }

    // Validate trùng lặp (không phân biệt hoa thường)
    const existingCategory = await Category.findOne({
      where: { category_name: category_name.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm hàng này đã tồn tại trên hệ thống.',
      });
    }

    const newCategory = await Category.create({
      category_name: category_name.trim(),
    });

    return res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Tạo nhóm hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/categories/:id (Cập nhật nhóm hàng)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    // Validate rỗng
    if (!category_name || category_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm hàng không được để trống.',
      });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Nhóm hàng không tồn tại để cập nhật.',
      });
    }

    // Validate trùng lặp (không trùng với các nhóm hàng khác)
    const duplicateCategory = await Category.findOne({
      where: {
        category_name: category_name.trim(),
      },
    });

    // Nếu trùng tên với một record khác record đang được sửa
    if (duplicateCategory && duplicateCategory.category_id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm hàng này đã được sử dụng bởi nhóm hàng khác.',
      });
    }

    category.category_name = category_name.trim();
    await category.save();

    return res.status(200).json({
      success: true,
      data: category,
      message: 'Cập nhật nhóm hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/categories/:id (Xóa nhóm hàng)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Nhóm hàng không tồn tại trên hệ thống.',
      });
    }

    // Kiểm tra các sản phẩm tham chiếu tới nhóm hàng này
    const linkedProduct = await Product.findOne({
      where: { category_id: id },
    });

    if (linkedProduct) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa vì đang có sản phẩm sử dụng.',
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa nhóm hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};
