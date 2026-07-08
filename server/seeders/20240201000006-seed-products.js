'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Lấy danh sách category_id đã tạo để gán ngẫu nhiên
    const [categories] = await queryInterface.sequelize.query(
      'SELECT category_id FROM categories;'
    );

    if (!categories || categories.length === 0) {
      throw new Error('Chưa có categories để tạo products seeder. Hãy seed categories trước.');
    }

    const categoryIds = categories.map(c => c.category_id);

    await queryInterface.bulkInsert('products', [
      {
        product_code: 'IC-STM32F103',
        product_name: 'Vi điều khiển STM32F103C8T6',
        category_id: categoryIds[0], // IC
        unit: 'Cái',
        min_stock: 50,
        description: 'ARM Cortex-M3 32-bit MCU, 64KB Flash, 20KB RAM',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'IC-NE555',
        product_name: 'IC Tạo Trễ NE555 SOP-8',
        category_id: categoryIds[0], // IC
        unit: 'Cái',
        min_stock: 100,
        description: 'Single precision timer',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'CAP-10UF-50V',
        product_name: 'Tụ hóa 10uF 50V',
        category_id: categoryIds[1] || categoryIds[0], // Tụ điện
        unit: 'Cái',
        min_stock: 200,
        description: 'Tụ phân cực',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'CAP-104-50V',
        product_name: 'Tụ gốm 104 (0.1uF) 50V',
        category_id: categoryIds[1] || categoryIds[0], // Tụ điện
        unit: 'Cái',
        min_stock: 500,
        description: 'Tụ không phân cực',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'RES-10K-0.25W',
        product_name: 'Điện trở 10K Ohm 1/4W 5%',
        category_id: categoryIds[2] || categoryIds[0], // Điện trở
        unit: 'Cái',
        min_stock: 1000,
        description: 'Điện trở cắm',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'RES-1K-0.25W',
        product_name: 'Điện trở 1K Ohm 1/4W 5%',
        category_id: categoryIds[2] || categoryIds[0], // Điện trở
        unit: 'Cái',
        min_stock: 1000,
        description: 'Điện trở cắm',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'PCB-UMC-CTRL-V1',
        product_name: 'Mạch in điều khiển UMC V1.0',
        category_id: categoryIds[3] || categoryIds[0], // PCB
        unit: 'Tấm',
        min_stock: 20,
        description: 'FR4 2 lớp, mạ vàng, dày 1.6mm',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'PCB-UMC-PWR-V2',
        product_name: 'Mạch in nguồn công suất UMC V2.0',
        category_id: categoryIds[3] || categoryIds[0], // PCB
        unit: 'Tấm',
        min_stock: 10,
        description: 'FR4 2 lớp, đồng 2oz, dày 1.6mm',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'CAB-XH2.54-4P',
        product_name: 'Dây cáp nối XH2.54 4-pin 20cm',
        category_id: categoryIds[4] || categoryIds[0], // Dây cáp
        unit: 'Sợi',
        min_stock: 150,
        description: 'Khoảng cách chân 2.54mm',
        createdAt: now,
        updatedAt: now,
      },
      {
        product_code: 'CAB-FLAT-10P',
        product_name: 'Dây cáp bẹt IDE 10-pin 30cm',
        category_id: categoryIds[4] || categoryIds[0], // Dây cáp
        unit: 'Sợi',
        min_stock: 50,
        description: 'Khoảng cách chân 1.27mm',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
