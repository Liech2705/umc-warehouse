'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_checks', {
      check_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'warehouse_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      check_date: { type: Sequelize.DATE, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM('Đang kiểm', 'Đã đối chiếu'),
        defaultValue: 'Đang kiểm',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory_checks');
  },
};
