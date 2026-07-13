const { Op } = require('sequelize');
const {
  sequelize,
  ExportReceipt,
  ExportDetail,
  Inventory,
  StockHistory,
  Product,
  Workshop,
  Warehouse,
  User,
} = require('../models');
const excelExportService = require('../services/excelExportService');

// [POST] /api/exports (Tạo phiếu xuất kho - Dùng Transaction)
exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { export_type, workshop_id, warehouse_id, note, details } = req.body;

    // 1. Ánh xạ export_type từ client thành ENUM của DB
    let typeMapped = export_type;
    if (export_type === 'XUONG_SX') typeMapped = 'Xuất cho xưởng SX';
    else if (export_type === 'BAN') typeMapped = 'Xuất bán';
    else if (export_type === 'TRA_NCC') typeMapped = 'Xuất trả NCC';

    const validTypes = ['Xuất cho xưởng SX', 'Xuất bán', 'Xuất trả NCC'];
    if (!typeMapped || !validTypes.includes(typeMapped)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kiểu xuất kho không hợp lệ. Phải là XUONG_SX, BAN, hoặc TRA_NCC.',
      });
    }

    // 2. Validate ràng buộc dữ liệu đầu vào
    if (typeMapped === 'Xuất cho xưởng SX' && !workshop_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'workshop_id là bắt buộc đối với kiểu xuất cho xưởng sản xuất.',
      });
    }

    if (!warehouse_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id (Kho xuất) không được để trống.',
      });
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chi tiết phiếu xuất (details) phải là mảng và không được để trống.',
      });
    }

    // Kiểm tra kho xuất tồn tại
    const sourceWarehouse = await Warehouse.findByPk(warehouse_id, { transaction });
    if (!sourceWarehouse) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kho xuất hàng được chọn không tồn tại.',
      });
    }

    // 3. Tự sinh export_code định dạng PX-YYYYMMDD-XXXX (XXXX tăng dần)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const lastReceipt = await ExportReceipt.findOne({
      where: {
        export_code: {
          [Op.like]: `PX-${dateStr}-%`,
        },
      },
      order: [['export_code', 'DESC']],
      transaction,
    });

    let nextSeq = 1;
    if (lastReceipt) {
      const parts = lastReceipt.export_code.split('-');
      const lastSeqStr = parts[parts.length - 1];
      nextSeq = parseInt(lastSeqStr, 10) + 1;
    }
    const sequenceStr = String(nextSeq).padStart(4, '0');
    const export_code = `PX-${dateStr}-${sequenceStr}`;

    // 4. Tạo record ExportReceipt
    const exportReceipt = await ExportReceipt.create(
      {
        export_code,
        export_type: typeMapped,
        workshop_id: typeMapped === 'Xuất cho xưởng SX' ? workshop_id : null,
        warehouse_id,
        user_id: req.user.user_id,
        export_date: new Date(),
        note: note ? note.trim() : null,
      },
      { transaction }
    );

    // 5. Xử lý trừ kho cho từng sản phẩm trong chi tiết phiếu xuất
    let totalExportValue = 0;
    for (const item of details) {
      const { product_id, quantity, batch_code } = item;

      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Thông tin sản phẩm hoặc số lượng xuất không hợp lệ.',
        });
      }

      // Kiểm tra sản phẩm tồn tại
      const prod = await Product.findByPk(product_id, { transaction });
      if (!prod) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID ${product_id} không tồn tại trên hệ thống.`,
        });
      }

      // Tìm toàn bộ dòng tồn kho của sản phẩm tại kho hàng được chọn
      const inventoryRecords = await Inventory.findAll({
        where: {
          product_id,
          warehouse_id,
        },
        order: [['location_id', 'ASC']], // Ưu tiên vị trí null hoặc ID nhỏ trước
        transaction,
      });

      // Tính tổng số lượng tồn khả dụng trong toàn bộ kho
      const totalAvailable = inventoryRecords.reduce((sum, rec) => sum + rec.quantity, 0);

      // Chụp đơn giá bình quân gia quyền trước khi trừ kho (dùng để ghi StockHistory)
      const unitCostSnapshot = totalAvailable > 0
        ? parseFloat(
            (inventoryRecords.reduce(
              (sum, rec) => sum + rec.quantity * parseFloat(rec.avg_unit_price || 0), 0
            ) / totalAvailable).toFixed(2)
          )
        : 0;

      // Chặn nếu không đủ tồn kho
      if (totalAvailable < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm [${prod.product_name}] không đủ tồn kho (hiện có: ${totalAvailable}, yêu cầu: ${quantity})`,
        });
      }

      // Trừ kho theo chiến lược trừ dần các vị trí
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

      // a. Tạo ExportDetail
      await ExportDetail.create(
        {
          export_id: exportReceipt.export_id,
          product_id,
          quantity,
          batch_code: batch_code ? batch_code.trim() : null,
        },
        { transaction }
      );

      // b. Tạo lịch sử tồn kho (StockHistory) kèm giá trị biến động
      const qtyExport = parseInt(quantity, 10);
      const totalValueLine = parseFloat((-qtyExport * unitCostSnapshot).toFixed(2));
      totalExportValue += Math.abs(totalValueLine);

      await StockHistory.create(
        {
          product_id,
          warehouse_id,
          change_type: 'Xuất',
          reference_id: exportReceipt.export_id,
          quantity_change: -qtyExport,
          unit_cost: unitCostSnapshot,
          total_value: totalValueLine,
          user_id: req.user.user_id,
          created_at: new Date(),
        },
        { transaction }
      );
    }

    // Commit transaction
    await transaction.commit();

    // 6. Truy vấn lại để trả thông tin phiếu xuất kèm chi tiết đầy đủ
    const responseData = await ExportReceipt.findByPk(exportReceipt.export_id, {
      include: [
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: ExportDetail,
          include: [{ model: Product, attributes: ['product_code', 'product_name', 'unit'] }],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: responseData,
      total_export_value: parseFloat(totalExportValue.toFixed(2)),
      message: 'Xuất kho và cập nhật số lượng tồn thành công.',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [GET] /api/exports (Lấy danh sách phiếu xuất kho có bộ lọc & phân trang)
exports.getAll = async (req, res, next) => {
  try {
    const { warehouse_id, export_type, start_date, end_date, page = 1, limit = 20 } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;
    const offset = (pageInt - 1) * limitInt;

    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (export_type) {
      let typeMapped = export_type;
      if (export_type === 'XUONG_SX') typeMapped = 'Xuất cho xưởng SX';
      else if (export_type === 'BAN') typeMapped = 'Xuất bán';
      else if (export_type === 'TRA_NCC') typeMapped = 'Xuất trả NCC';
      whereClause.export_type = typeMapped;
    }

    // Lọc theo khoảng ngày
    if (start_date || end_date) {
      whereClause.export_date = {};
      if (start_date) {
        whereClause.export_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        whereClause.export_date[Op.lte] = end;
      }
    }

    const { count, rows } = await ExportReceipt.findAndCountAll({
      where: whereClause,
      include: [
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name'] },
      ],
      offset,
      limit: limitInt,
      order: [['export_id', 'DESC']],
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
      message: 'Lấy danh sách phiếu xuất kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/exports/:id (Chi tiết phiếu xuất kho)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exportReceipt = await ExportReceipt.findByPk(id, {
      include: [
        { model: Workshop, attributes: ['workshop_name', 'manager_name'] },
        { model: Warehouse, attributes: ['warehouse_name', 'location'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: ExportDetail,
          include: [{ model: Product, attributes: ['product_code', 'product_name', 'unit'] }],
        },
      ],
    });

    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu xuất kho không tồn tại.',
      });
    }

    const totalValueResult = await StockHistory.sum('total_value', {
      where: {
        reference_id: id,
        change_type: 'Xuất',
      },
    });
    const totalExportValue = Math.abs(parseFloat(totalValueResult || 0));

    return res.status(200).json({
      success: true,
      data: exportReceipt,
      total_export_value: parseFloat(totalExportValue.toFixed(2)),
      message: 'Lấy thông tin chi tiết phiếu xuất kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/exports/export (Xuất file Excel danh sách phiếu xuất kho)
exports.exportExcel = async (req, res, next) => {
  try {
    const { warehouse_id, export_type, start_date, end_date } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (export_type) {
      let typeMapped = export_type;
      if (export_type === 'XUONG_SX') typeMapped = 'Xuất cho xưởng SX';
      else if (export_type === 'BAN') typeMapped = 'Xuất bán';
      else if (export_type === 'TRA_NCC') typeMapped = 'Xuất trả NCC';
      whereClause.export_type = typeMapped;
    }

    if (start_date || end_date) {
      whereClause.export_date = {};
      if (start_date) {
        whereClause.export_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        whereClause.export_date[Op.lte] = end;
      }
    }

    const exportsData = await ExportReceipt.findAll({
      where: whereClause,
      include: [
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name'] },
      ],
      order: [['export_id', 'DESC']],
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

    const data = exportsData.map((item, index) => {
      let receiverName = '';
      if (item.export_type === 'Xuất cho xưởng SX') {
        receiverName = item.Workshop?.workshop_name || '';
      } else {
        receiverName = 'Khách hàng / Đối tác';
      }

      return {
        index: index + 1,
        export_code: item.export_code,
        export_date: formatDate(item.export_date),
        export_type: item.export_type,
        receiver_name: receiverName,
        warehouse_name: item.Warehouse?.warehouse_name || '',
        note: item.note || '',
        created_by: item.User?.full_name || '',
      };
    });

    const columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Mã phiếu', key: 'export_code', width: 18 },
      { header: 'Ngày xuất', key: 'export_date', width: 15 },
      { header: 'Loại xuất', key: 'export_type', width: 22 },
      { header: 'Người nhận / Xưởng', key: 'receiver_name', width: 28 },
      { header: 'Kho xuất', key: 'warehouse_name', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 30 },
      { header: 'Người lập', key: 'created_by', width: 20 },
    ];

    await excelExportService.exportToExcel(res, {
      sheetName: 'Phieu_Xuat_Kho',
      columns,
      data,
    });
  } catch (error) {
    next(error);
  }
};
