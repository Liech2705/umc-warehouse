'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory', {
      inventory_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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
      quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory');
  },
};
