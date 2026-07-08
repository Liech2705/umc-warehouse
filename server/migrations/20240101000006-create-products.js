'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      product_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      product_name: { type: Sequelize.STRING, allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categories', key: 'category_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      unit: { type: Sequelize.STRING },
      min_stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      description: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
