'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('export_receipts', {
      export_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      export_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      export_type: {
        type: Sequelize.ENUM('Xuất cho xưởng SX', 'Xuất bán', 'Xuất trả NCC'),
        allowNull: false,
      },
      workshop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'workshops', key: 'workshop_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'warehouse_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      export_date: { type: Sequelize.DATE, allowNull: false },
      note: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('export_receipts');
  },
};
