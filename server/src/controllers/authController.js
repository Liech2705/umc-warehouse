const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.',
      });
    }

    // Tìm user trên hệ thống
    const user = await User.findOne({ where: { username } });

    // Trả cùng một thông báo lỗi 401 để bảo mật (không tiết lộ username tồn tại hay không)
    const invalidAuthMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác.';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: invalidAuthMessage,
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: invalidAuthMessage,
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 1) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản này đã bị khóa hoặc ngừng hoạt động.',
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
    }

    // Get the user from request
    const user = req.user;

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ không đúng.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
    });
  } catch (error) {
    next(error);
  }
};
