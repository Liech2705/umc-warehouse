'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory', 'avg_unit_price', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
      after: 'quantity',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventory', 'avg_unit_price');
  },
};
