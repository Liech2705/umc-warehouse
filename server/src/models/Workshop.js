'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Workshop extends Model {
    static associate(models) {
      Workshop.hasMany(models.ImportReceipt, { foreignKey: 'workshop_id' });
      Workshop.hasMany(models.ExportReceipt, { foreignKey: 'workshop_id' });
      Workshop.hasMany(models.DefectiveItem, { foreignKey: 'workshop_id' });
    }
  }

  Workshop.init(
    {
      workshop_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      workshop_name: { type: DataTypes.STRING, allowNull: false },
      manager_name: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'Workshop',
      tableName: 'workshops',
      timestamps: true,
    }
  );

  return Workshop;
};
