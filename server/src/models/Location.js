'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      Location.hasMany(models.Inventory, { foreignKey: 'location_id' });
      Location.hasMany(models.ImportDetail, { foreignKey: 'location_id' });
    }
  }

  Location.init(
    {
      location_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      location_code: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Location',
      tableName: 'locations',
      timestamps: true,
    }
  );

  return Location;
};
