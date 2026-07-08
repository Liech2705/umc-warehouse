'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ImportDetail extends Model {
    static associate(models) {
      ImportDetail.belongsTo(models.ImportReceipt, { foreignKey: 'import_id' });
      ImportDetail.belongsTo(models.Product, { foreignKey: 'product_id' });
      ImportDetail.belongsTo(models.Location, { foreignKey: 'location_id' });
    }
  }

  ImportDetail.init(
    {
      import_detail_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      import_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      batch_code: { type: DataTypes.STRING },
      expiry_date: { type: DataTypes.DATEONLY },
      location_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'ImportDetail',
      tableName: 'import_details',
      timestamps: true,
    }
  );

  return ImportDetail;
};
