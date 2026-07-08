'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      category_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      category_name: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
