const { Op } = require('sequelize');
const {
  sequelize,
  DefectiveItem,
  ScrapReceipt,
  Inventory,
  StockHistory,
  Product,
  Warehouse,
  Workshop,
  ImportReceipt,
  Supplier,
  User,
} = require('../models');
const excelExportService = require('../services/excelExportService');

// [POST] /api/defective-items (Báo cáo hàng lỗi - trừ kho cách ly hàng hỏng)
exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { product_id, warehouse_id, source_type, workshop_id, import_id, quantity, reason } =
      req.body;

    // 1. Ánh xạ source_type từ client
    let typeMapped = source_type;
    if (source_type === 'NHAP') typeMapped = 'Lỗi khi nhập';
    else if (source_type === 'XUONG_TRA') typeMapped = 'Xưởng trả lỗi';
    else if (source_type === 'TON_LAU') typeMapped = 'Tồn kho lâu ngày';

    const validTypes = ['Lỗi khi nhập', 'Xưởng trả lỗi', 'Tồn kho lâu ngày'];
    if (!typeMapped || !validTypes.includes(typeMapped)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Nguồn báo lỗi (source_type) không hợp lệ. Phải là NHAP, XUONG_TRA, hoặc TON_LAU.',
      });
    }

    if (!product_id || !warehouse_id || !quantity || quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thông tin sản phẩm, kho hàng hoặc số lượng không hợp lệ.',
      });
    }

    // Kiểm tra sản phẩm và kho tồn tại
    const prod = await Product.findByPk(product_id, { transaction });
    if (!prod) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    const wh = await Warehouse.findByPk(warehouse_id, { transaction });
    if (!wh) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kho hàng không tồn tại.',
      });
    }

    // 2. Tìm toàn bộ tồn kho để trừ và chuyển sang cách ly hàng hỏng
    const inventoryRecords = await Inventory.findAll({
      where: { product_id, warehouse_id },
      order: [['location_id', 'ASC']],
      transaction,
    });

    const totalAvailable = inventoryRecords.reduce((sum, rec) => sum + rec.quantity, 0);
    if (totalAvailable < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không đủ số lượng trong kho để ghi nhận lỗi (Hiện có: ${totalAvailable}, Yêu cầu cách ly: ${quantity}).`,
      });
    }

    // Trừ kho cách ly
    let remainingToDeduct = parseInt(quantity, 10);
    for (const inv of inventoryRecords) {
      if (remainingToDeduct <= 0) break;

      if (inv.quantity >= remainingToDeduct) {
        inv.quantity -= remainingToDeduct;
        remainingToDeduct = 0;
        await inv.save({ transaction });
      } else {
        remainingToDeduct -= inv.quantity;
        inv.quantity = 0;
        await inv.save({ transaction });
      }
    }

    // 3. Tạo record DefectiveItem
    const defectiveItem = await DefectiveItem.create(
      {
        product_id,
        warehouse_id,
        source_type: typeMapped,
        workshop_id: typeMapped === 'Xưởng trả lỗi' ? workshop_id : null,
        import_id: typeMapped === 'Lỗi khi nhập' ? import_id : null,
        quantity,
        reason: reason ? reason.trim() : null,
        status: 'Chờ xử lý',
        reported_by: req.user.user_id,
        reported_at: new Date(),
      },
      { transaction }
    );

    // 4. Ghi nhận StockHistory với type 'Hủy' (Đồng bộ ENUM của DB) làm lượng âm
    await StockHistory.create(
      {
        product_id,
        warehouse_id,
        change_type: 'Hủy',
        reference_id: defectiveItem.defective_id,
        quantity_change: -parseInt(quantity, 10),
        user_id: req.user.user_id,
        created_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      data: defectiveItem,
      message: 'Báo cáo sản phẩm lỗi và thực hiện trừ kho cách ly thành công.',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [GET] /api/defective-items (Lấy danh sách hàng lỗi có filter & phân trang)
exports.getAll = async (req, res, next) => {
  try {
    const { status, warehouse_id, source_type, page = 1, limit = 10 } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;

    const whereClause = {};

    if (status) {
      let statusMapped = status;
      if (status === 'CHO_XU_LY') statusMapped = 'Chờ xử lý';
      else if (status === 'DA_HUY') statusMapped = 'Đã hủy';
      else if (status === 'TRA_NCC') statusMapped = 'Trả NCC';
      whereClause.status = statusMapped;
    }

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (source_type) {
      let typeMapped = source_type;
      if (source_type === 'NHAP') typeMapped = 'Lỗi khi nhập';
      else if (source_type === 'XUONG_TRA') typeMapped = 'Xưởng trả lỗi';
      else if (source_type === 'TON_LAU') typeMapped = 'Tồn kho lâu ngày';
      whereClause.source_type = typeMapped;
    }

    const { count, rows } = await DefectiveItem.findAndCountAll({
      where: whereClause,
      include: [
        { model: Product, attributes: ['product_code', 'product_name', 'unit'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: Workshop, attributes: ['workshop_name'] },
        { model: User, as: 'reporter', attributes: ['full_name'] },
        {
          model: ScrapReceipt,
          include: [
            { model: User, as: 'approver', attributes: ['full_name'] },
          ],
        },
      ],
      offset,
      limit: limitInt,
      order: [['defective_id', 'DESC']],
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
      message: 'Lấy danh sách hàng lỗi thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/defective-items/:id/scrap (Phê duyệt hủy hàng lỗi - Admin/QuanLy)
exports.scrap = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { note } = req.body;

    const defective = await DefectiveItem.findByPk(id, { transaction });
    if (!defective) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Thông tin hàng lỗi không tồn tại.',
      });
    }

    if (defective.status !== 'Chờ xử lý') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ phê duyệt hủy đối với hàng lỗi ở trạng thái Chờ xử lý.',
      });
    }

    // 1. Tạo phiếu hủy ScrapReceipt
    await ScrapReceipt.create(
      {
        defective_id: defective.defective_id,
        approved_by: req.user.user_id,
        scrap_date: new Date(),
        note: note ? note.trim() : null,
      },
      { transaction }
    );

    // 2. Chuyển trạng thái DefectiveItem sang 'Đã hủy'
    defective.status = 'Đã hủy';
    await defective.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Xác nhận hủy bỏ sản phẩm lỗi thành công. Phiếu hủy đã được lưu.',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [PUT] /api/defective-items/:id/return-to-supplier (Trả nhà cung cấp)
exports.returnToSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const defective = await DefectiveItem.findByPk(id);
    if (!defective) {
      return res.status(404).json({
        success: false,
        message: 'Thông tin hàng lỗi không tồn tại.',
      });
    }

    if (defective.status !== 'Chờ xử lý') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể chuyển đổi trạng thái Trả NCC khi hàng lỗi đang Chờ xử lý.',
      });
    }

    defective.status = 'Trả NCC';
    await defective.save();

    return res.status(200).json({
      success: true,
      message: 'Chuyển đổi trạng thái sang Trả NCC thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/reports/defective-summary (Thống kê hàng lỗi)
exports.getSummary = async (req, res, next) => {
  try {
    // 1. Lỗi theo Xưởng
    const byWorkshop = await DefectiveItem.findAll({
      attributes: [
        [sequelize.col('Workshop.workshop_name'), 'workshop_name'],
        [sequelize.fn('SUM', sequelize.col('DefectiveItem.quantity')), 'total_quantity'],
      ],
      include: [
        {
          model: Workshop,
          attributes: [],
          required: true,
        },
      ],
      group: ['Workshop.workshop_name', 'Workshop.workshop_id'],
      raw: true,
    });

    // 2. Lỗi theo Supplier (thông qua ImportReceipt)
    const bySupplier = await DefectiveItem.findAll({
      attributes: [
        [sequelize.col('ImportReceipt.Supplier.supplier_name'), 'supplier_name'],
        [sequelize.fn('SUM', sequelize.col('DefectiveItem.quantity')), 'total_quantity'],
      ],
      include: [
        {
          model: ImportReceipt,
          attributes: [],
          required: true,
          include: [
            {
              model: Supplier,
              attributes: [],
              required: true,
            },
          ],
        },
      ],
      group: ['ImportReceipt.Supplier.supplier_name', 'ImportReceipt.Supplier.supplier_id'],
      raw: true,
    });

    // 3. Lỗi theo tháng (MySQL format)
    const byMonth = await DefectiveItem.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('reported_at'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('reported_at'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('reported_at'), '%Y-%m'), 'DESC']],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        byWorkshop,
        bySupplier,
        byMonth,
      },
      message: 'Lấy thống kê hàng lỗi thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/defective-items/export (Xuất file Excel danh sách hàng lỗi/hủy)
exports.exportExcel = async (req, res, next) => {
  try {
    const { status, warehouse_id, source_type } = req.query;
    const whereClause = {};

    if (status) {
      let statusMapped = status;
      if (status === 'CHO_XU_LY') statusMapped = 'Chờ xử lý';
      else if (status === 'DA_HUY') statusMapped = 'Đã hủy';
      else if (status === 'TRA_NCC') statusMapped = 'Trả NCC';
      whereClause.status = statusMapped;
    }

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (source_type) {
      let typeMapped = source_type;
      if (source_type === 'NHAP') typeMapped = 'Lỗi khi nhập';
      else if (source_type === 'XUONG_TRA') typeMapped = 'Xưởng trả lỗi';
      else if (source_type === 'TON_LAU') typeMapped = 'Tồn kho lâu ngày';
      whereClause.source_type = typeMapped;
    }

    const defectives = await DefectiveItem.findAll({
      where: whereClause,
      include: [
        { model: Product, attributes: ['product_code', 'product_name', 'unit'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: Workshop, attributes: ['workshop_name'] },
        { model: User, as: 'reporter', attributes: ['full_name'] },
      ],
      order: [['defective_id', 'DESC']],
    });

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const data = defectives.map((item, index) => ({
      index: index + 1,
      defective_id: item.defective_id,
      reported_at: formatDate(item.reported_at),
      product_code: item.Product?.product_code || '',
      product_name: item.Product?.product_name || '',
      unit: item.Product?.unit || '',
      quantity: item.quantity,
      reason: item.reason || '',
      warehouse_name: item.Warehouse?.warehouse_name || '',
      source_type: item.source_type,
      workshop_name: item.Workshop?.workshop_name || '',
      status: item.status,
      reporter_name: item.reporter?.full_name || '',
    }));

    const columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Mã ghi nhận', key: 'defective_id', width: 12 },
      { header: 'Ngày báo cáo', key: 'reported_at', width: 15 },
      { header: 'Mã sản phẩm', key: 'product_code', width: 15 },
      { header: 'Tên sản phẩm', key: 'product_name', width: 30 },
      { header: 'Đơn vị tính', key: 'unit', width: 12 },
      { header: 'Số lượng hỏng', key: 'quantity', width: 15 },
      { header: 'Lý do hỏng', key: 'reason', width: 30 },
      { header: 'Kho phát sinh', key: 'warehouse_name', width: 20 },
      { header: 'Nguồn gốc', key: 'source_type', width: 18 },
      { header: 'Xưởng liên quan', key: 'workshop_name', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Người báo cáo', key: 'reporter_name', width: 20 },
    ];

    await excelExportService.exportToExcel(res, {
      sheetName: 'Hang_Loi_Hong',
      columns,
      data,
    });
  } catch (error) {
    next(error);
  }
};
