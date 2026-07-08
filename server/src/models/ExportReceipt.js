'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExportReceipt extends Model {
    static associate(models) {
      ExportReceipt.belongsTo(models.Workshop, { foreignKey: 'workshop_id' });
      ExportReceipt.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      ExportReceipt.belongsTo(models.User, { foreignKey: 'user_id' });
      ExportReceipt.hasMany(models.ExportDetail, { foreignKey: 'export_id' });
    }
  }

  ExportReceipt.init(
    {
      export_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      export_code: { type: DataTypes.STRING, allowNull: false, unique: true },
      export_type: {
        type: DataTypes.ENUM('Xuất cho xưởng SX', 'Xuất bán', 'Xuất trả NCC'),
        allowNull: false,
      },
      workshop_id: { type: DataTypes.INTEGER, allowNull: true },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      export_date: { type: DataTypes.DATE, allowNull: false },
      note: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: 'ExportReceipt',
      tableName: 'export_receipts',
      timestamps: true,
    }
  );

  return ExportReceipt;
};
