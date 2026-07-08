'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ScrapReceipt extends Model {
    static associate(models) {
      ScrapReceipt.belongsTo(models.DefectiveItem, { foreignKey: 'defective_id' });
      ScrapReceipt.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    }
  }

  ScrapReceipt.init(
    {
      scrap_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      defective_id: { type: DataTypes.INTEGER, allowNull: false },
      approved_by: { type: DataTypes.INTEGER, allowNull: false },
      scrap_date: { type: DataTypes.DATE, allowNull: false },
      note: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: 'ScrapReceipt',
      tableName: 'scrap_receipts',
      timestamps: true,
    }
  );

  return ScrapReceipt;
};
