const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập lại.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống.',
      });
    }

    if (user.status !== 1) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    let message = 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
    if (error.name === 'TokenExpiredError') {
      message = 'Mã xác thực đã hết hạn. Vui lòng đăng nhập lại.';
    }
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = authMiddleware;
