const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  ImportReceipt,
  ExportReceipt,
  ImportDetail,
  ExportDetail,
  DefectiveItem,
} = require('../models');

// [GET] /api/dashboard/summary (Lấy dữ liệu tổng hợp cho trang chủ dashboard)
exports.getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Tổng số sản phẩm
    const totalProducts = await Product.count();

    // 2. Tổng số phiếu nhập trong tháng
    const totalImports = await ImportReceipt.count({
      where: {
        import_date: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    // 3. Tổng số phiếu xuất trong tháng
    const totalExports = await ExportReceipt.count({
      where: {
        export_date: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    // 4. Top 5 sản phẩm sắp hết hàng (quantity < min_stock)
    // Tính tổng tồn kho của mỗi sản phẩm và đối chiếu với min_stock
    const lowStockProducts = await Product.findAll({
      attributes: [
        'product_id',
        'product_code',
        'product_name',
        'unit',
        'min_stock',
        [
          sequelize.literal(
            '(SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE inventory.product_id = Product.product_id)'
          ),
          'total_quantity',
        ],
      ],
      having: sequelize.literal('total_quantity < min_stock'),
      order: [[sequelize.literal('total_quantity'), 'ASC']],
      limit: 5,
    });

    // 5. Tổng số lượng hàng lỗi đang CHO_XU_LY
    const defectiveHoldSum = await DefectiveItem.sum('quantity', {
      where: { status: 'Chờ xử lý' },
    });
    const totalDefectiveHold = defectiveHoldSum || 0;

    // 6. Biểu đồ dữ liệu: Số lượng nhập/xuất 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Lấy số lượng nhập theo ngày
    const importsLast7Days = await ImportDetail.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('ImportReceipt.import_date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('ImportDetail.quantity')), 'total_imported'],
      ],
      include: [
        {
          model: ImportReceipt,
          required: true,
          attributes: [],
          where: {
            import_date: { [Op.gte]: sevenDaysAgo },
          },
        },
      ],
      group: [sequelize.fn('DATE', sequelize.col('ImportReceipt.import_date'))],
      raw: true,
    });

    // Lấy số lượng xuất theo ngày
    const exportsLast7Days = await ExportDetail.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('ExportReceipt.export_date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('ExportDetail.quantity')), 'total_exported'],
      ],
      include: [
        {
          model: ExportReceipt,
          required: true,
          attributes: [],
          where: {
            export_date: { [Op.gte]: sevenDaysAgo },
          },
        },
      ],
      group: [sequelize.fn('DATE', sequelize.col('ExportReceipt.export_date'))],
      raw: true,
    });

    // Xây dựng mảng dữ liệu 7 ngày đầy đủ (kể cả những ngày không phát sinh giao dịch)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Tìm kiếm trong kết quả DB
      const imp = importsLast7Days.find((x) => x.date === dateStr);
      const exp = exportsLast7Days.find((x) => x.date === dateStr);

      chartData.push({
        date: dateStr,
        imported: imp ? parseInt(imp.total_imported, 10) : 0,
        exported: exp ? parseInt(exp.total_exported, 10) : 0,
      });
    }

    // 7. Top 5 sản phẩm xuất nhiều nhất trong tháng hiện tại
    const topExportedProducts = await ExportDetail.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('ExportDetail.quantity')), 'total_exported'],
      ],
      include: [
        {
          model: ExportReceipt,
          required: true,
          attributes: [],
          where: {
            export_date: { [Op.between]: [monthStart, monthEnd] },
          },
        },
        {
          model: Product,
          attributes: ['product_code', 'product_name', 'unit'],
        },
      ],
      group: ['ExportDetail.product_id', 'Product.product_id'],
      order: [[sequelize.fn('SUM', sequelize.col('ExportDetail.quantity')), 'DESC']],
      limit: 5,
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalImportsInMonth: totalImports,
          totalExportsInMonth: totalExports,
          totalDefectiveHold,
        },
        lowStockProducts,
        chartData,
        topExportedProducts,
      },
      message: 'Lấy dữ liệu tổng hợp dashboard thành công.',
    });
  } catch (error) {
    next(error);
  }
};
