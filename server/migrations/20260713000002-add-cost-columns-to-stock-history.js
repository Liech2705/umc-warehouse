'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stock_history', 'unit_cost', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      after: 'quantity_change',
    });
    await queryInterface.addColumn('stock_history', 'total_value', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      after: 'unit_cost',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('stock_history', 'total_value');
    await queryInterface.removeColumn('stock_history', 'unit_cost');
  },
};
