'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('categories', [
      { category_name: 'IC', createdAt: now, updatedAt: now },
      { category_name: 'Tụ điện', createdAt: now, updatedAt: now },
      { category_name: 'Điện trở', createdAt: now, updatedAt: now },
      { category_name: 'PCB', createdAt: now, updatedAt: now },
      { category_name: 'Dây cáp', createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', {
      category_name: ['IC', 'Tụ điện', 'Điện trở', 'PCB', 'Dây cáp'],
    });
  },
};
