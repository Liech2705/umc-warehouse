'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.ImportReceipt, { foreignKey: 'user_id' });
      User.hasMany(models.ExportReceipt, { foreignKey: 'user_id' });
      User.hasMany(models.StockHistory, { foreignKey: 'user_id' });
      User.hasMany(models.InventoryCheck, { foreignKey: 'user_id' });
      User.hasMany(models.DefectiveItem, { foreignKey: 'reported_by', as: 'reportedDefects' });
      User.hasMany(models.ScrapReceipt, { foreignKey: 'approved_by', as: 'approvedScraps' });
    }
  }

  User.init(
    {
      user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      full_name: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('Admin', 'ThuKho', 'NhanVien', 'QuanLy'),
        allowNull: false,
      },
      status: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
    }
  );

  return User;
};
