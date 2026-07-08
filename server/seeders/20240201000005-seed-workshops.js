'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('workshops', [
      {
        workshop_name: 'Xưởng SMT',
        manager_name: 'Phạm Văn Hùng',
        createdAt: now,
        updatedAt: now,
      },
      {
        workshop_name: 'Xưởng lắp ráp',
        manager_name: 'Nguyễn Thị Lan',
        createdAt: now,
        updatedAt: now,
      },
      {
        workshop_name: 'Xưởng đóng gói',
        manager_name: 'Võ Minh Tuấn',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('workshops', {
      workshop_name: ['Xưởng SMT', 'Xưởng lắp ráp', 'Xưởng đóng gói'],
    });
  },
};
