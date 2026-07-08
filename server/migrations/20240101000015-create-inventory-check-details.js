'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_check_details', {
      check_detail_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      check_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'inventory_checks', key: 'check_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'product_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      system_quantity: { type: Sequelize.INTEGER, allowNull: false },
      actual_quantity: { type: Sequelize.INTEGER, allowNull: false },
      difference: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory_check_details');
  },
};
