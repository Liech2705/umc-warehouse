'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      location_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'warehouse_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      location_code: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('locations');
  },
};
