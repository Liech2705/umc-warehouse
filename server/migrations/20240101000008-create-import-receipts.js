'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('import_receipts', {
      import_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      import_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      import_type: {
        type: Sequelize.ENUM('Từ NCC', 'Từ xưởng', 'Xưởng trả lại'),
        allowNull: false,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'supplier_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      import_date: { type: Sequelize.DATE, allowNull: false },
      note: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('import_receipts');
  },
};
