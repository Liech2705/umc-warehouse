'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = bcrypt.hashSync('123456', 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password: hash,
        full_name: 'Nguyễn Văn Admin',
        role: 'Admin',
        status: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        username: 'thukho01',
        password: hash,
        full_name: 'Trần Thị Thu Kho',
        role: 'ThuKho',
        status: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        username: 'quanly01',
        password: hash,
        full_name: 'Lê Văn Quản Lý',
        role: 'QuanLy',
        status: 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      username: ['admin', 'thukho01', 'quanly01'],
    });
  },
};
