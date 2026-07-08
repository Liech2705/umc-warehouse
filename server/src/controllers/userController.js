const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /api/users
exports.getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['user_id', 'ASC']],
    });
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
exports.create = async (req, res, next) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
      });
    }

    const validRoles = ['Admin', 'ThuKho', 'NhanVien', 'QuanLy'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ.',
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại trên hệ thống.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      full_name: full_name.trim(),
      role,
      status: 1, // Active by default
    });

    // Remove password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      data: userResponse,
      message: `Tài khoản "${username}" đã được tạo thành công.`,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, status } = req.body;

    if (parseInt(id, 10) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự cập nhật hoặc vô hiệu hóa tài khoản của chính mình.',
      });
    }

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.',
      });
    }

    if (full_name) userToUpdate.full_name = full_name.trim();
    if (role) {
      const validRoles = ['Admin', 'ThuKho', 'NhanVien', 'QuanLy'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Vai trò không hợp lệ.',
        });
      }
      userToUpdate.role = role;
    }
    if (status !== undefined) {
      userToUpdate.status = status;
    }

    await userToUpdate.save();

    const userResponse = userToUpdate.toJSON();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      data: userResponse,
      message: `Cập nhật tài khoản "${userToUpdate.username}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu mới.',
      });
    }

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    userToUpdate.password = hashedPassword;
    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: `Đặt lại mật khẩu cho tài khoản "${userToUpdate.username}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id (Soft delete by setting status = 0)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản của chính mình.',
      });
    }

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.',
      });
    }

    // Set status to 0 (Locked)
    userToUpdate.status = 0;
    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: `Đã khóa tài khoản "${userToUpdate.username}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};
