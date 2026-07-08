'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('warehouses', {
      warehouse_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_name: { type: Sequelize.STRING, allowNull: false },
      location: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('warehouses');
  },
};
