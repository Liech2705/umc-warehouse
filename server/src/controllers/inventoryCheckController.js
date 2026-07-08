const {
  sequelize,
  InventoryCheck,
  InventoryCheckDetail,
  Inventory,
  StockHistory,
  Warehouse,
  Product,
  User,
} = require('../models');

// [POST] /api/inventory-checks (Tạo phiếu kiểm kê mới - Tự động load tồn kho hệ thống)
exports.createCheck = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { warehouse_id } = req.body;

    if (!warehouse_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id (Kho hàng) không được để trống.',
      });
    }

    const warehouse = await Warehouse.findByPk(warehouse_id, { transaction });
    if (!warehouse) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kho hàng được chọn không tồn tại.',
      });
    }

    // 1. Tạo phiếu kiểm kê gốc với trạng thái 'Đang kiểm'
    const newCheck = await InventoryCheck.create(
      {
        warehouse_id,
        check_date: new Date(),
        user_id: req.user.user_id,
        status: 'Đang kiểm',
      },
      { transaction }
    );

    // 2. Lấy toàn bộ sản phẩm đang có tồn kho tại kho đó (nhóm theo product_id và sum quantity)
    const currentInventory = await Inventory.findAll({
      where: { warehouse_id },
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      ],
      group: ['product_id'],
      transaction,
    });

    // 3. Tạo chi tiết kiểm kê tương ứng cho từng sản phẩm
    if (currentInventory && currentInventory.length > 0) {
      const detailsToCreate = currentInventory.map((item) => {
        const sysQty = parseInt(item.getDataValue('total_quantity'), 10) || 0;
        return {
          check_id: newCheck.check_id,
          product_id: item.product_id,
          system_quantity: sysQty,
          actual_quantity: null, // Chưa kiểm đếm thực tế
          difference: 0,
        };
      });

      await InventoryCheckDetail.bulkCreate(detailsToCreate, { transaction });
    }

    await transaction.commit();

    // Lấy lại phiếu kiểm kê kèm chi tiết để trả về
    const responseData = await InventoryCheck.findByPk(newCheck.check_id, {
      include: [
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: InventoryCheckDetail,
          include: [{ model: Product, attributes: ['product_code', 'product_name', 'unit'] }],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Tạo phiếu kiểm kê thành công. Hệ thống đã tự động sao chép tồn kho lý thuyết.',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [PUT] /api/inventory-checks/:id/details (Nhập/Cập nhật số lượng kiểm thực tế cho các dòng)
exports.updateDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { details } = req.body; // Mảng [{ check_detail_id, actual_quantity }] hoặc [{ product_id, actual_quantity }]

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật chi tiết (details) không hợp lệ.',
      });
    }

    const checkSheet = await InventoryCheck.findByPk(id);
    if (!checkSheet) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu kiểm kê không tồn tại.',
      });
    }

    if (checkSheet.status === 'Đã đối chiếu') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu kiểm kê này đã được xác nhận đối chiếu, không thể chỉnh sửa số lượng.',
      });
    }

    // Cập nhật từng chi tiết
    for (const item of details) {
      const { check_detail_id, product_id, actual_quantity } = item;

      if (actual_quantity === undefined || actual_quantity === null || actual_quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng thực tế nhập vào phải lớn hơn hoặc bằng 0.',
        });
      }

      // Xác định điều kiện tìm dòng chi tiết
      const whereClause = { check_id: id };
      if (check_detail_id) {
        whereClause.check_detail_id = check_detail_id;
      } else if (product_id) {
        whereClause.product_id = product_id;
      } else {
        continue;
      }

      const detail = await InventoryCheckDetail.findOne({ where: whereClause });
      if (detail) {
        const actualQtyInt = parseInt(actual_quantity, 10);
        detail.actual_quantity = actualQtyInt;
        detail.difference = actualQtyInt - detail.system_quantity;
        await detail.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật số lượng kiểm đếm thực tế thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/inventory-checks/:id/confirm (Xác nhận đối chiếu và điều chỉnh tồn kho - Chỉ Admin, QuanLy)
exports.confirmCheck = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const checkSheet = await InventoryCheck.findByPk(id, { transaction });
    if (!checkSheet) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Phiếu kiểm kê không tồn tại.',
      });
    }

    if (checkSheet.status === 'Đã đối chiếu') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phiếu kiểm kê này đã được xác nhận đối chiếu trước đó.',
      });
    }

    // Lấy chi tiết phiếu
    const details = await InventoryCheckDetail.findAll({
      where: { check_id: id },
      transaction,
    });

    // Kiểm tra xem đã kiểm đếm đầy đủ chưa
    const hasUnchecked = details.some((d) => d.actual_quantity === null);
    if (hasUnchecked) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          'Phiếu kiểm kê vẫn còn sản phẩm chưa được kiểm đếm thực tế. Vui lòng cập nhật đầy đủ.',
      });
    }

    // Điều chỉnh tồn kho thực tế dựa trên chênh lệch (difference)
    for (const d of details) {
      const { product_id, difference, actual_quantity } = d;

      if (difference !== 0) {
        // Tìm bản ghi tồn kho của sản phẩm tại kho này (ưu tiên dòng không có location hoặc location_id nhỏ trước)
        const inventory = await Inventory.findOne({
          where: {
            product_id,
            warehouse_id: checkSheet.warehouse_id,
          },
          order: [['location_id', 'ASC']],
          transaction,
        });

        if (inventory) {
          inventory.quantity += difference;
          if (inventory.quantity < 0) {
            inventory.quantity = 0; // Đảm bảo không bị số lượng tồn âm
          }
          await inventory.save({ transaction });
        } else {
          // Nếu sản phẩm chưa từng có trong kho này, tạo mới
          if (actual_quantity > 0) {
            await Inventory.create(
              {
                product_id,
                warehouse_id: checkSheet.warehouse_id,
                location_id: null,
                quantity: actual_quantity,
                updated_at: new Date(),
              },
              { transaction }
            );
          }
        }

        // Tạo StockHistory ghi nhận điều chỉnh
        await StockHistory.create(
          {
            product_id,
            warehouse_id: checkSheet.warehouse_id,
            change_type: 'Điều chỉnh kiểm kê', // Khớp với ENUM của DB
            reference_id: checkSheet.check_id,
            quantity_change: difference,
            user_id: req.user.user_id,
            created_at: new Date(),
          },
          { transaction }
        );
      }
    }

    // Cập nhật trạng thái phiếu thành 'Đã đối chiếu'
    checkSheet.status = 'Đã đối chiếu';
    await checkSheet.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message:
        'Đối chiếu phiếu kiểm kê thành công. Số lượng tồn kho đã được điều chỉnh khớp thực tế.',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// [GET] /api/inventory-checks (Lấy danh sách phiếu kiểm kê)
exports.getAllChecks = async (req, res, next) => {
  try {
    const { warehouse_id, status } = req.query;
    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    if (status) {
      let statusMapped = status;
      if (status === 'DANG_KIEM') statusMapped = 'Đang kiểm';
      else if (status === 'DA_DOI_CHIEU') statusMapped = 'Đã đối chiếu';
      whereClause.status = statusMapped;
    }

    const checks = await InventoryCheck.findAll({
      where: whereClause,
      include: [
        { model: Warehouse, attributes: ['warehouse_name'] },
        { model: User, attributes: ['full_name'] },
      ],
      order: [['check_id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: checks,
      message: 'Lấy danh sách phiếu kiểm kê thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/inventory-checks/:id (Chi tiết phiếu kiểm kê)
exports.getCheckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkSheet = await InventoryCheck.findByPk(id, {
      include: [
        { model: Warehouse, attributes: ['warehouse_name', 'location'] },
        { model: User, attributes: ['full_name', 'username'] },
        {
          model: InventoryCheckDetail,
          include: [{ model: Product, attributes: ['product_code', 'product_name', 'unit'] }],
        },
      ],
    });

    if (!checkSheet) {
      return res.status(404).json({
        success: false,
        message: 'Phiếu kiểm kê không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: checkSheet,
      message: 'Lấy thông tin chi tiết phiếu kiểm kê thành công.',
    });
  } catch (error) {
    next(error);
  }
};
