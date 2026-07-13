const { Op } = require('sequelize');
const {
  sequelize,
  ImportReceipt,
  ImportDetail,
  Inventory,
  StockHistory,
  Product,
  Supplier,
  Workshop,
  Warehouse,
  Location,
  User,
} = require('../models');
const excelExportService = require('../services/excelExportService');

// [POST] /api/imports (Tạo phiếu nhập kho - Dùng Transaction)
exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { import_type, supplier_id, workshop_id, warehouse_id, note, details } = req.body;

    // 1. Ánh xạ import_type từ client gửi lên thành ENUM của DB
    let typeMapped = import_type;
    if (import_type === 'NCC') typeMapped = 'Từ NCC';
    else if (import_type === 'XUONG') typeMapped = 'Từ xưởng';
    else if (import_type === 'TRA_LAI') typeMapped = 'Xưởng trả lại';

    const validTypes = ['Từ NCC', 'Từ xưởng', 'Xưởng trả lại'];
    if (!typeMapped || !validTypes.includes(typeMapped)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kiểu nhập kho không hợp lệ. Phải là NCC, XUONG, hoặc TRA_LAI.',
      });
    }

    // 2. Validate ràng buộc dữ liệu đầu vào
    if (typeMapped === 'Từ NCC' && !supplier_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'supplier_id là bắt buộc đối với kiểu nhập từ nhà cung cấp (NCC).',
      });
    }

    if ((typeMapped === 'Từ xưởng' || typeMapped === 'Xưởng trả lại') && !workshop_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'workshop_id là bắt buộc đối với kiểu nhập từ xưởng hoặc xưởng trả lại.',
      });
    }

    if (!warehouse_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id (Kho nhập) không được để trống.',
      });
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chi tiết phiếu nhập (details) phải là mảng và không được để trống.',
      });
    }

    // Kiểm tra kho có tồn tại không
    const destinationWarehouse = await Warehouse.findByPk(warehouse_id, { transaction });
    if (!destinationWarehouse) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kho nhập hàng được chọn không tồn tại.',
      });
    }

    // 3. Kiểm tra vị trí kho (location_id) có thuộc đúng kho hàng đang nhập không
    for (const item of details) {
      if (item.location_id) {
        const loc = await Location.findByPk(item.location_id, { transaction });
        if (!loc) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Vị trí kho với ID ${item.location_id} không tồn tại.`,
          });
        }
        if (loc.warehouse_id !== parseInt(warehouse_id)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Lỗi: Vị trí '${loc.location_code}' không thuộc về kho đang nhập '${destinationWarehouse.warehouse_name}'.`,
          });
        }
      }
    }

    // 4. Tự sinh import_code định dạng PN-YYYYMMDD-XXXX (XXXX tăng dần)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const lastReceipt = await ImportReceipt.findOne({
      where: {
        import_code: {
          [Op.like]: `PN-${dateStr}-%`,
        },
      },
      order: [['import_code', 'DESC']],
      transaction,
    });

    let nextSeq = 1;
    if (lastReceipt) {
      const parts = lastReceipt.import_code.split('-');
      const lastSeqStr = parts[parts.length - 1];
      nextSeq = parseInt(lastSeqStr, 10) + 1;
    }
    const sequenceStr = String(nextSeq).padStart(4, '0');
    const import_code = `PN-${dateStr}-${sequenceStr}`;

    // 5. Tạo record ImportReceipt
    const importReceipt = await ImportReceipt.create(
      {
        import_code,
        import_type: typeMapped,
        supplier_id: typeMapped === 'Từ NCC' ? supplier_id : null,
        workshop_id: typeMapped !== 'Từ NCC' ? workshop_id : null,
        warehouse_id,
        user_id: req.user.user_id,
        import_date: new Date(),
        note: note ? note.trim() : null,
      },
      { transaction }
    );

    // 6. Xử lý từng sản phẩm trong chi tiết phiếu nhập
    for (const item of details) {
      const { product_id, quantity, unit_price, batch_code, expiry_date, location_id } = item;

      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Thông tin sản phẩm hoặc số lượng nhập không hợp lệ.',
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

      // a. Tạo ImportDetail
      await ImportDetail.create(
        {
          import_id: importReceipt.import_id,
          product_id,
          quantity,
          unit_price: unit_price || 0,
          batch_code: batch_code ? batch_code.trim() : null,
          expiry_date: expiry_date || null,
          location_id: location_id || null,
        },
        { transaction }
      );

      // b. Cập nhật tồn kho (Inventory) + tính bình quân gia quyền
      const inventory = await Inventory.findOne({
        where: {
          product_id,
          warehouse_id,
          location_id: location_id || null,
        },
        transaction,
      });

      const qtyImport = parseInt(quantity, 10);
      let unitCostForHistory;

      if (typeMapped === 'Từ NCC') {
        // Tính bình quân gia quyền: (tồn_cũ * giá_cũ + qty_nhập * giá_nhập) / (tồn_cũ + qty_nhập)
        const oldQty = inventory ? inventory.quantity : 0;
        const oldAvg = inventory ? parseFloat(inventory.avg_unit_price) : 0;
        const importPrice = parseFloat(unit_price) || 0;
        const newAvg = parseFloat(
          ((oldQty * oldAvg + qtyImport * importPrice) / (oldQty + qtyImport)).toFixed(2)
        );
        unitCostForHistory = importPrice;

        if (inventory) {
          inventory.quantity += qtyImport;
          inventory.avg_unit_price = newAvg;
          await inventory.save({ transaction });
        } else {
          await Inventory.create(
            {
              product_id,
              warehouse_id,
              location_id: location_id || null,
              quantity: qtyImport,
              avg_unit_price: newAvg,
              updated_at: new Date(),
            },
            { transaction }
          );
        }
      } else {
        // XUONG / TRA_LAI: chỉ cộng quantity, giữ nguyên avg_unit_price
        unitCostForHistory = inventory ? parseFloat(inventory.avg_unit_price) : 0;

        if (inventory) {
          inventory.quantity += qtyImport;
          await inventory.save({ transaction });
        } else {
          await Inventory.create(
            {
              product_id,
              warehouse_id,
              location_id: location_id || null,
              quantity: qtyImport,
              updated_at: new Date(),
            },
            { transaction }
          );
        }
      }

      // c. Tạo lịch sử tồn kho (StockHistory) kèm giá trị biến động
      await StockHistory.create(
        {
          product_id,
          warehouse_id,
          change_type: 'Nhập',
          reference_id: importReceipt.import_id,
          quantity_change: qtyImport,
          unit_cost: parseFloat(unitCostForHistory.toFixed(2)),
          total_value: parseFloat((qtyImport * unitCostForHistory).toFixed(2)),
          user_id: req.user.user_id,
          created_at: new Date(),
        },
        { transaction }
      );
    }

    // Commit tất cả các thay đổi
    await transaction.commit();

    // 7. Truy vấn lại để trả thông tin phiếu kèm chi tiết đầy đủ
    const responseData = await ImportReceipt.findByPk(importReceipt.import_id, {
      include: [
        { model: Supplier, attributes: ['supplier_name'] },
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: ImportDetail,
          include: [
            { model: Product, attributes: ['product_code', 'product_name', 'unit'] },
            { model: Location, attributes: ['location_code'] },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Nhập kho và cập nhật số lượng tồn thành công.',
    });
  } catch (error) {
    // Tránh treo transaction nếu lỗi xảy ra giữa chừng
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [GET] /api/imports (Lấy danh sách phiếu nhập kho có bộ lọc & phân trang)
exports.getAll = async (req, res, next) => {
  try {
    const { warehouse_id, import_type, start_date, end_date, page = 1, limit = 20 } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;
    const offset = (pageInt - 1) * limitInt;

    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (import_type) {
      let typeMapped = import_type;
      if (import_type === 'NCC') typeMapped = 'Từ NCC';
      else if (import_type === 'XUONG') typeMapped = 'Từ xưởng';
      else if (import_type === 'TRA_LAI') typeMapped = 'Xưởng trả lại';
      whereClause.import_type = typeMapped;
    }

    // Lọc theo khoảng ngày
    if (start_date || end_date) {
      whereClause.import_date = {};
      if (start_date) {
        whereClause.import_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999); // Hết ngày
        whereClause.import_date[Op.lte] = end;
      }
    }

    const { count, rows } = await ImportReceipt.findAndCountAll({
      where: whereClause,
      include: [
        { model: Supplier, attributes: ['supplier_name'] },
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name'] },
      ],
      offset,
      limit: limitInt,
      order: [['import_id', 'DESC']],
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
      message: 'Lấy danh sách phiếu nhập kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/imports/:id (Chi tiết phiếu nhập kèm quan hệ đầy đủ)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const importReceipt = await ImportReceipt.findByPk(id, {
      include: [
        { model: Supplier, attributes: ['supplier_name', 'phone', 'contact_person'] },
        { model: Workshop, attributes: ['workshop_name', 'manager_name'] },
        { model: Warehouse, attributes: ['warehouse_name', 'location'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: ImportDetail,
          include: [
            { model: Product, attributes: ['product_code', 'product_name', 'unit'] },
            { model: Location, attributes: ['location_code', 'description'] },
          ],
        },
      ],
    });

    if (!importReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu nhập kho không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: importReceipt,
      message: 'Lấy thông tin chi tiết phiếu nhập kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/imports/export (Xuất file Excel danh sách phiếu nhập kho)
exports.exportExcel = async (req, res, next) => {
  try {
    const { warehouse_id, import_type, start_date, end_date } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (import_type) {
      let typeMapped = import_type;
      if (import_type === 'NCC') typeMapped = 'Từ NCC';
      else if (import_type === 'XUONG') typeMapped = 'Từ xưởng';
      else if (import_type === 'TRA_LAI') typeMapped = 'Xưởng trả lại';
      whereClause.import_type = typeMapped;
    }

    if (start_date || end_date) {
      whereClause.import_date = {};
      if (start_date) {
        whereClause.import_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        whereClause.import_date[Op.lte] = end;
      }
    }

    const imports = await ImportReceipt.findAll({
      where: whereClause,
      include: [
        { model: Supplier, attributes: ['supplier_name'] },
        { model: Workshop, attributes: ['workshop_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name'] },
      ],
      order: [['import_id', 'DESC']],
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

    const data = imports.map((item, index) => {
      let originName = '';
      if (item.import_type === 'Từ NCC') {
        originName = item.Supplier?.supplier_name || '';
      } else {
        originName = item.Workshop?.workshop_name || '';
      }

      return {
        index: index + 1,
        import_code: item.import_code,
        import_date: formatDate(item.import_date),
        import_type: item.import_type,
        origin_name: originName,
        warehouse_name: item.Warehouse?.warehouse_name || '',
        note: item.note || '',
        created_by: item.User?.full_name || '',
      };
    });

    const columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Mã phiếu', key: 'import_code', width: 18 },
      { header: 'Ngày lập', key: 'import_date', width: 15 },
      { header: 'Loại nhập', key: 'import_type', width: 15 },
      { header: 'Đối tác / Xưởng', key: 'origin_name', width: 28 },
      { header: 'Kho nhận', key: 'warehouse_name', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 30 },
      { header: 'Người lập', key: 'created_by', width: 20 },
    ];

    await excelExportService.exportToExcel(res, {
      sheetName: 'Phieu_Nhap_Kho',
      columns,
      data,
    });
  } catch (error) {
    next(error);
  }
};
