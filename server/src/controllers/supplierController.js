const { Supplier, ImportReceipt } = require('../models');

// [GET] /api/suppliers
exports.getAll = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['supplier_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: suppliers,
      message: 'Lấy danh sách nhà cung cấp thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/suppliers/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại.',
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
      message: 'Lấy thông tin nhà cung cấp thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/suppliers
exports.create = async (req, res, next) => {
  try {
    const { supplier_name, contact_person, phone, email, address } = req.body;

    if (!supplier_name || supplier_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp không được để trống.',
      });
    }

    const existingSupplier = await Supplier.findOne({
      where: { supplier_name: supplier_name.trim() },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp này đã tồn tại trên hệ thống.',
      });
    }

    const newSupplier = await Supplier.create({
      supplier_name: supplier_name.trim(),
      contact_person: contact_person ? contact_person.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
    });

    return res.status(201).json({
      success: true,
      data: newSupplier,
      message: 'Tạo nhà cung cấp thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/suppliers/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_person, phone, email, address } = req.body;

    if (!supplier_name || supplier_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp không được để trống.',
      });
    }

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại để cập nhật.',
      });
    }

    const duplicateSupplier = await Supplier.findOne({
      where: { supplier_name: supplier_name.trim() },
    });

    if (duplicateSupplier && duplicateSupplier.supplier_id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp này đã được sử dụng bởi nhà cung cấp khác.',
      });
    }

    supplier.supplier_name = supplier_name.trim();
    supplier.contact_person = contact_person ? contact_person.trim() : null;
    supplier.phone = phone ? phone.trim() : null;
    supplier.email = email ? email.trim() : null;
    supplier.address = address ? address.trim() : null;

    await supplier.save();

    return res.status(200).json({
      success: true,
      data: supplier,
      message: 'Cập nhật nhà cung cấp thành công.',
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/suppliers/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại trên hệ thống.',
      });
    }

    // Kiểm tra liên kết tới ImportReceipt
    const linkedReceipt = await ImportReceipt.findOne({
      where: { supplier_id: id },
    });

    if (linkedReceipt) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa vì đang có phiếu nhập hàng liên kết với nhà cung cấp này.',
      });
    }

    await supplier.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa nhà cung cấp thành công.',
    });
  } catch (error) {
    next(error);
  }
};
