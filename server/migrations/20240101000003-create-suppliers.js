'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suppliers', {
      supplier_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      supplier_name: { type: Sequelize.STRING, allowNull: false },
      contact_person: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('suppliers');
  },
};
