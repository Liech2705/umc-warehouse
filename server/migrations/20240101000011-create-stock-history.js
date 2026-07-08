'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_history', {
      history_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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
      change_type: {
        type: Sequelize.ENUM('Nhập', 'Xuất', 'Hủy', 'Điều chỉnh kiểm kê'),
        allowNull: false,
      },
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      quantity_change: { type: Sequelize.INTEGER, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_history');
  },
};
