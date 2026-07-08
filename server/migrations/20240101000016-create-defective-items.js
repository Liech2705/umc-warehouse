'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('defective_items', {
      defective_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'product_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'warehouse_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      source_type: {
        type: Sequelize.ENUM('Lỗi khi nhập', 'Xưởng trả lỗi', 'Tồn kho lâu ngày'),
        allowNull: false,
      },
      workshop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'workshops', key: 'workshop_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      import_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'import_receipts', key: 'import_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      reason: { type: Sequelize.TEXT },
      status: {
        type: Sequelize.ENUM('Chờ xử lý', 'Đã hủy', 'Trả NCC'),
        defaultValue: 'Chờ xử lý',
      },
      reported_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      reported_at: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('defective_items');
  },
};
