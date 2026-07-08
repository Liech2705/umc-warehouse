'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('suppliers', [
      {
        supplier_name: 'Công ty TNHH Linh kiện Điện tử Phương Nam',
        contact_person: 'Nguyễn Minh Khoa',
        phone: '0901234567',
        email: 'phuongnam@supplier.vn',
        address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
        createdAt: now,
        updatedAt: now,
      },
      {
        supplier_name: 'Công ty CP Điện tử Thành Đạt',
        contact_person: 'Trần Bích Ngọc',
        phone: '0987654321',
        email: 'thanhdatelectronics@supplier.vn',
        address: '456 Lê Văn Việt, Q.9, TP.HCM',
        createdAt: now,
        updatedAt: now,
      },
      {
        supplier_name: 'Murata Manufacturing Vietnam',
        contact_person: 'Tanaka Hiroshi',
        phone: '02838001234',
        email: 'supply@murata.vn',
        address: 'KCN Thăng Long, Hà Nội',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('suppliers', {
      email: [
        'phuongnam@supplier.vn',
        'thanhdatelectronics@supplier.vn',
        'supply@murata.vn',
      ],
    });
  },
};
