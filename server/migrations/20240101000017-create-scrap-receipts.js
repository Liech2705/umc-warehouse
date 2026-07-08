'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scrap_receipts', {
      scrap_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      defective_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'defective_items', key: 'defective_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      scrap_date: { type: Sequelize.DATE, allowNull: false },
      note: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('scrap_receipts');
  },
};
