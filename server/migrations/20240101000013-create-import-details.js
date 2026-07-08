'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('import_details', {
      import_detail_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      import_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'import_receipts', key: 'import_id' },
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
      unit_price: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      batch_code: { type: Sequelize.STRING },
      expiry_date: { type: Sequelize.DATEONLY },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('import_details');
  },
};
