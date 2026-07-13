'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    static associate(models) {
      Inventory.belongsTo(models.Product, { foreignKey: 'product_id' });
      Inventory.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      Inventory.belongsTo(models.Location, { foreignKey: 'location_id' });
    }
  }

  Inventory.init(
    {
      inventory_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      location_id: { type: DataTypes.INTEGER, allowNull: true },
      quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
      avg_unit_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'Inventory',
      tableName: 'inventory',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: false,
    }
  );

  return Inventory;
};
