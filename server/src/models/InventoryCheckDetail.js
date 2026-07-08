'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventoryCheckDetail extends Model {
    static associate(models) {
      InventoryCheckDetail.belongsTo(models.InventoryCheck, { foreignKey: 'check_id' });
      InventoryCheckDetail.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }

  InventoryCheckDetail.init(
    {
      check_detail_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      check_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      system_quantity: { type: DataTypes.INTEGER, allowNull: false },
      actual_quantity: { type: DataTypes.INTEGER, allowNull: false },
      difference: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: 'InventoryCheckDetail',
      tableName: 'inventory_check_details',
      timestamps: true,
    }
  );

  return InventoryCheckDetail;
};
