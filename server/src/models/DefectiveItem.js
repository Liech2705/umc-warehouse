'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DefectiveItem extends Model {
    static associate(models) {
      DefectiveItem.belongsTo(models.Product, { foreignKey: 'product_id' });
      DefectiveItem.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      DefectiveItem.belongsTo(models.Workshop, { foreignKey: 'workshop_id' });
      DefectiveItem.belongsTo(models.ImportReceipt, { foreignKey: 'import_id' });
      DefectiveItem.belongsTo(models.User, { foreignKey: 'reported_by', as: 'reporter' });
      DefectiveItem.hasOne(models.ScrapReceipt, { foreignKey: 'defective_id' });
    }
  }

  DefectiveItem.init(
    {
      defective_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      source_type: {
        type: DataTypes.ENUM('Lỗi khi nhập', 'Xưởng trả lỗi', 'Tồn kho lâu ngày'),
        allowNull: false,
      },
      workshop_id: { type: DataTypes.INTEGER, allowNull: true },
      import_id: { type: DataTypes.INTEGER, allowNull: true },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM('Chờ xử lý', 'Đã hủy', 'Trả NCC'),
        defaultValue: 'Chờ xử lý',
      },
      reported_by: { type: DataTypes.INTEGER, allowNull: false },
      reported_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'DefectiveItem',
      tableName: 'defective_items',
      timestamps: true,
    }
  );

  return DefectiveItem;
};
