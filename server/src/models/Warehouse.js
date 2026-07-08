'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      Warehouse.hasMany(models.Location, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.ImportReceipt, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.ExportReceipt, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.Inventory, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.StockHistory, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.InventoryCheck, { foreignKey: 'warehouse_id' });
      Warehouse.hasMany(models.DefectiveItem, { foreignKey: 'warehouse_id' });
    }
  }

  Warehouse.init(
    {
      warehouse_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_name: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'Warehouse',
      tableName: 'warehouses',
      timestamps: true,
    }
  );

  return Warehouse;
};
