'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      Supplier.hasMany(models.ImportReceipt, { foreignKey: 'supplier_id' });
    }
  }

  Supplier.init(
    {
      supplier_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      supplier_name: { type: DataTypes.STRING, allowNull: false },
      contact_person: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'Supplier',
      tableName: 'suppliers',
      timestamps: true,
    }
  );

  return Supplier;
};
