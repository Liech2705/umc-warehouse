'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workshops', {
      workshop_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workshop_name: { type: Sequelize.STRING, allowNull: false },
      manager_name: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workshops');
  },
};
