'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockHistory extends Model {
    static associate(models) {
      StockHistory.belongsTo(models.Product, { foreignKey: 'product_id' });
      StockHistory.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      StockHistory.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  StockHistory.init(
    {
      history_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      change_type: {
        type: DataTypes.ENUM('Nhập', 'Xuất', 'Hủy', 'Điều chỉnh kiểm kê'),
        allowNull: false,
      },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      quantity_change: { type: DataTypes.INTEGER, allowNull: false },
      unit_cost: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      total_value: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: 'StockHistory',
      tableName: 'stock_history',
      timestamps: true,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  return StockHistory;
};
