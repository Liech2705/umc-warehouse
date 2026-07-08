'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('warehouses', [
      {
        warehouse_name: 'Kho NVL',
        location: 'Tầng 1, Tòa nhà A, KCN UMC',
        createdAt: now,
        updatedAt: now,
      },
      {
        warehouse_name: 'Kho thành phẩm',
        location: 'Tầng 2, Tòa nhà A, KCN UMC',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('warehouses', {
      warehouse_name: ['Kho NVL', 'Kho thành phẩm'],
    });
  },
};
