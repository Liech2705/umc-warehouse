'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('Admin', 'ThuKho', 'NhanVien', 'QuanLy'),
        allowNull: false,
      },
      status: { type: Sequelize.TINYINT, defaultValue: 1 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
