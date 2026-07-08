'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm cột description vào bảng locations (nếu chưa có)
    const tableInfoLocations = await queryInterface.describeTable('locations');
    if (!tableInfoLocations.description) {
      await queryInterface.addColumn('locations', 'description', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 2. Thêm cột location_id vào bảng inventory (nếu chưa có)
    const tableInfoInventory = await queryInterface.describeTable('inventory');
    if (!tableInfoInventory.location_id) {
      await queryInterface.addColumn('inventory', 'location_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'location_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    // Rollback: xóa các cột đã thêm
    const tableInfoInventory = await queryInterface.describeTable('inventory');
    if (tableInfoInventory.location_id) {
      await queryInterface.removeColumn('inventory', 'location_id');
    }

    const tableInfoLocations = await queryInterface.describeTable('locations');
    if (tableInfoLocations.description) {
      await queryInterface.removeColumn('locations', 'description');
    }
  },
};
