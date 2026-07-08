const { Op } = require('sequelize');
const {
  sequelize,
  Inventory,
  Product,
  Warehouse,
  Location,
  StockHistory,
  User,
} = require('../models');
const excelExportService = require('../services/excelExportService');

// [GET] /api/inventory (Lấy danh sách tồn kho hiện tại)
exports.getInventory = async (req, res, next) => {
  try {
    const { warehouse_id, low_stock } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['product_code', 'product_name', 'unit', 'min_stock'],
        },
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
        {
          model: Location,
          attributes: ['location_code'],
        },
      ],
      order: [
        ['warehouse_id', 'ASC'],
        ['product_id', 'ASC'],
      ],
    };

    // Filter sản phẩm tồn thấp hơn mức tối thiểu (quantity < min_stock)
    if (low_stock === 'true') {
      queryOptions.where[Op.and] = [
        sequelize.where(
          sequelize.col('Inventory.quantity'),
          '<',
          sequelize.col('Product.min_stock')
        ),
      ];
    }

    const inventory = await Inventory.findAll(queryOptions);

    return res.status(200).json({
      success: true,
      data: inventory,
      message: 'Lấy danh sách tồn kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/products/:id/stock-history (Lịch sử biến động của 1 sản phẩm)
exports.getProductStockHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    const history = await StockHistory.findAll({
      where: { product_id: id },
      include: [
        {
          model: User,
          attributes: ['full_name', 'username'],
        },
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
      ],
      order: [['history_id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: history,
      message: 'Lấy lịch sử biến động sản phẩm thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/inventory/export (Xuất file Excel danh sách tồn kho)
exports.exportExcel = async (req, res, next) => {
  try {
    const { warehouse_id, low_stock } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['product_code', 'product_name', 'unit', 'min_stock'],
        },
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
        {
          model: Location,
          attributes: ['location_code'],
        },
      ],
      order: [
        ['warehouse_id', 'ASC'],
        ['product_id', 'ASC'],
      ],
    };

    if (low_stock === 'true') {
      queryOptions.where[Op.and] = [
        sequelize.where(
          sequelize.col('Inventory.quantity'),
          '<',
          sequelize.col('Product.min_stock')
        ),
      ];
    }

    const inventory = await Inventory.findAll(queryOptions);

    // Format data for Excel
    const data = inventory.map((item, index) => ({
      index: index + 1,
      product_code: item.Product?.product_code || '',
      product_name: item.Product?.product_name || '',
      unit: item.Product?.unit || '',
      quantity: item.quantity,
      min_stock: item.Product?.min_stock || 0,
      warehouse_name: item.Warehouse?.warehouse_name || '',
      location_code: item.Location?.location_code || 'Chưa định vị',
    }));

    const columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Mã sản phẩm', key: 'product_code', width: 15 },
      { header: 'Tên sản phẩm', key: 'product_name', width: 35 },
      { header: 'Đơn vị tính', key: 'unit', width: 12 },
      { header: 'Số lượng tồn', key: 'quantity', width: 15 },
      { header: 'Mức tối thiểu', key: 'min_stock', width: 15 },
      { header: 'Kho hàng', key: 'warehouse_name', width: 25 },
      { header: 'Vị trí', key: 'location_code', width: 15 },
    ];

    await excelExportService.exportToExcel(res, {
      sheetName: 'Ton_Kho_Realtime',
      columns,
      data,
    });
  } catch (error) {
    next(error);
  }
};
