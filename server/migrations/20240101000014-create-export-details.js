'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('export_details', {
      export_detail_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      export_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'export_receipts', key: 'export_id' },
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
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      batch_code: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('export_details');
  },
};
