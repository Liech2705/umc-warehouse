const { Op } = require('sequelize');
const {
  Product,
  Category,
  ImportDetail,
  ExportDetail,
  Inventory,
  StockHistory,
  InventoryCheckDetail,
  DefectiveItem,
} = require('../models');

// [GET] /api/products (Lấy danh sách sản phẩm kèm phân trang, tìm kiếm, lọc)
exports.getAll = async (req, res, next) => {
  try {
    const { category_id, keyword, page = 1, limit = 20 } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;
    const offset = (pageInt - 1) * limitInt;

    const whereClause = {};

    // Lọc theo nhóm hàng
    if (category_id) {
      whereClause.category_id = category_id;
    }

    // Tìm kiếm theo từ khóa (mã SKU hoặc tên sản phẩm)
    if (keyword && keyword.trim() !== '') {
      const searchKeyword = `%${keyword.trim()}%`;
      whereClause[Op.or] = [
        { product_name: { [Op.like]: searchKeyword } },
        { product_code: { [Op.like]: searchKeyword } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
      ],
      offset,
      limit: limitInt,
      order: [['product_id', 'DESC']],
    });

    const totalPages = Math.ceil(count / limitInt);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageInt,
        limit: limitInt,
      },
      message: 'Lấy danh sách sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/products/:id (Lấy chi tiết sản phẩm)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Lấy thông tin sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/products (Thêm mới sản phẩm)
exports.create = async (req, res, next) => {
  try {
    const { product_code, product_name, category_id, unit, min_stock, description } = req.body;

    // Validate bắt buộc
    if (!product_code || product_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm không được để trống.' });
    }
    if (!product_name || product_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm không được để trống.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn nhóm hàng.' });
    }

    // Kiểm tra nhóm hàng tồn tại
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: 'Nhóm hàng được chọn không tồn tại.' });
    }

    // Kiểm tra trùng mã SKU
    const existingCode = await Product.findOne({
      where: { product_code: product_code.trim() },
    });
    if (existingCode) {
      return res
        .status(400)
        .json({ success: false, message: 'Mã SKU này đã tồn tại trên hệ thống.' });
    }

    const newProduct = await Product.create({
      product_code: product_code.trim(),
      product_name: product_name.trim(),
      category_id,
      unit: unit ? unit.trim() : null,
      min_stock: parseInt(min_stock) || 0,
      description: description ? description.trim() : null,
    });

    // Load lại kèm category_name để trả về FE
    const responseData = await Product.findByPk(newProduct.product_id, {
      include: [{ model: Category, attributes: ['category_name'] }],
    });

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Tạo sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/products/:id (Cập nhật sản phẩm)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_code, product_name, category_id, unit, min_stock, description } = req.body;

    // Validate bắt buộc
    if (!product_code || product_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm không được để trống.' });
    }
    if (!product_name || product_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm không được để trống.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn nhóm hàng.' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Sản phẩm không tồn tại để cập nhật.' });
    }

    // Kiểm tra nhóm hàng tồn tại
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: 'Nhóm hàng được chọn không tồn tại.' });
    }

    // Kiểm tra trùng mã SKU (ngoại trừ chính nó)
    const duplicateCode = await Product.findOne({
      where: { product_code: product_code.trim() },
    });
    if (duplicateCode && duplicateCode.product_id !== parseInt(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Mã SKU này đã được sử dụng bởi sản phẩm khác.' });
    }

    product.product_code = product_code.trim();
    product.product_name = product_name.trim();
    product.category_id = category_id;
    product.unit = unit ? unit.trim() : null;
    product.min_stock = parseInt(min_stock) || 0;
    product.description = description ? description.trim() : null;

    await product.save();

    // Load kèm category_name để trả về FE
    const responseData = await Product.findByPk(product.product_id, {
      include: [{ model: Category, attributes: ['category_name'] }],
    });

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Cập nhật sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/products/:id (Xóa sản phẩm)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại trên hệ thống.',
      });
    }

    // Kiểm tra tất cả các liên kết ngoại của Product trước khi xóa
    const whereProduct = { where: { product_id: id } };
    const checks = await Promise.all([
      ImportDetail.findOne(whereProduct),
      ExportDetail.findOne(whereProduct),
      Inventory.findOne(whereProduct),
      StockHistory.findOne(whereProduct),
      InventoryCheckDetail.findOne(whereProduct),
      DefectiveItem.findOne(whereProduct),
    ]);

    if (checks.some((r) => r !== null)) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa vì đang có dữ liệu kho (phiếu nhập/phiếu xuất/tồn kho/hàng lỗi) sử dụng sản phẩm này.',
      });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};
