'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'category_id' });
      Product.hasMany(models.ImportDetail, { foreignKey: 'product_id' });
      Product.hasMany(models.ExportDetail, { foreignKey: 'product_id' });
      Product.hasMany(models.Inventory, { foreignKey: 'product_id' });
      Product.hasMany(models.StockHistory, { foreignKey: 'product_id' });
      Product.hasMany(models.InventoryCheckDetail, { foreignKey: 'product_id' });
      Product.hasMany(models.DefectiveItem, { foreignKey: 'product_id' });
    }
  }

  Product.init(
    {
      product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_code: { type: DataTypes.STRING, allowNull: false, unique: true },
      product_name: { type: DataTypes.STRING, allowNull: false },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      unit: { type: DataTypes.STRING },
      min_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      description: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      timestamps: true,
    }
  );

  return Product;
};
