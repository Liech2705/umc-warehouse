'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ImportReceipt extends Model {
    static associate(models) {
      ImportReceipt.belongsTo(models.Supplier, { foreignKey: 'supplier_id' });
      ImportReceipt.belongsTo(models.Workshop, { foreignKey: 'workshop_id' });
      ImportReceipt.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      ImportReceipt.belongsTo(models.User, { foreignKey: 'user_id' });
      ImportReceipt.hasMany(models.ImportDetail, { foreignKey: 'import_id' });
      ImportReceipt.hasMany(models.DefectiveItem, { foreignKey: 'import_id' });
    }
  }

  ImportReceipt.init(
    {
      import_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      import_code: { type: DataTypes.STRING, allowNull: false, unique: true },
      import_type: {
        type: DataTypes.ENUM('Từ NCC', 'Từ xưởng', 'Xưởng trả lại'),
        allowNull: false,
      },
      supplier_id: { type: DataTypes.INTEGER, allowNull: true },
      workshop_id: { type: DataTypes.INTEGER, allowNull: true },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      import_date: { type: DataTypes.DATE, allowNull: false },
      note: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: 'ImportReceipt',
      tableName: 'import_receipts',
      timestamps: true,
    }
  );

  return ImportReceipt;
};
