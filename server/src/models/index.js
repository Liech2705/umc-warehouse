'use strict';

const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Load tất cả models theo thứ tự dependency
const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Supplier = require('./Supplier')(sequelize, DataTypes);
const Warehouse = require('./Warehouse')(sequelize, DataTypes);
const Workshop = require('./Workshop')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Location = require('./Location')(sequelize, DataTypes);
const ImportReceipt = require('./ImportReceipt')(sequelize, DataTypes);
const ExportReceipt = require('./ExportReceipt')(sequelize, DataTypes);
const Inventory = require('./Inventory')(sequelize, DataTypes);
const StockHistory = require('./StockHistory')(sequelize, DataTypes);
const InventoryCheck = require('./InventoryCheck')(sequelize, DataTypes);
const ImportDetail = require('./ImportDetail')(sequelize, DataTypes);
const ExportDetail = require('./ExportDetail')(sequelize, DataTypes);
const InventoryCheckDetail = require('./InventoryCheckDetail')(sequelize, DataTypes);
const DefectiveItem = require('./DefectiveItem')(sequelize, DataTypes);
const ScrapReceipt = require('./ScrapReceipt')(sequelize, DataTypes);

const db = {
  User,
  Category,
  Supplier,
  Warehouse,
  Workshop,
  Product,
  Location,
  ImportReceipt,
  ExportReceipt,
  Inventory,
  StockHistory,
  InventoryCheck,
  ImportDetail,
  ExportDetail,
  InventoryCheckDetail,
  DefectiveItem,
  ScrapReceipt,
};

// Khởi chạy tất cả associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
