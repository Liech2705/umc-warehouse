'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventoryCheck extends Model {
    static associate(models) {
      InventoryCheck.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      InventoryCheck.belongsTo(models.User, { foreignKey: 'user_id' });
      InventoryCheck.hasMany(models.InventoryCheckDetail, { foreignKey: 'check_id' });
    }
  }

  InventoryCheck.init(
    {
      check_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      check_date: { type: DataTypes.DATE, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('Đang kiểm', 'Đã đối chiếu'),
        defaultValue: 'Đang kiểm',
      },
    },
    {
      sequelize,
      modelName: 'InventoryCheck',
      tableName: 'inventory_checks',
      timestamps: true,
    }
  );

  return InventoryCheck;
};
