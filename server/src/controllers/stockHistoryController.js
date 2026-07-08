const { Op } = require('sequelize');
const { StockHistory, Product, Warehouse, User } = require('../models');

// [GET] /api/stock-history
exports.getAll = async (req, res, next) => {
  try {
    const { change_type, product_id, warehouse_id, from, to, start_date, end_date, page = 1, limit = 20 } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;
    const offset = (pageInt - 1) * limitInt;

    const whereClause = {};

    if (change_type) {
      whereClause.change_type = change_type;
    }

    if (product_id) {
      whereClause.product_id = product_id;
    }

    if (warehouse_id) {
      whereClause.warehouse_id = warehouse_id;
    }

    const startDate = from || start_date;
    const endDate = to || end_date;

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = end;
      }
    }

    const { count, rows } = await StockHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['product_code', 'product_name', 'unit'],
        },
        {
          model: Warehouse,
          attributes: ['warehouse_name'],
        },
        {
          model: User,
          attributes: ['full_name'],
        },
      ],
      offset,
      limit: limitInt,
      order: [['history_id', 'DESC']],
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
      message: 'Lấy lịch sử biến động kho thành công.',
    });
  } catch (error) {
    next(error);
  }
};
