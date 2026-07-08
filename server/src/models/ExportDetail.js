'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExportDetail extends Model {
    static associate(models) {
      ExportDetail.belongsTo(models.ExportReceipt, { foreignKey: 'export_id' });
      ExportDetail.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }

  ExportDetail.init(
    {
      export_detail_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      export_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      batch_code: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'ExportDetail',
      tableName: 'export_details',
      timestamps: true,
    }
  );

  return ExportDetail;
};
