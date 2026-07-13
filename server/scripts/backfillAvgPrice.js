require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');
const { sequelize, Inventory, ImportDetail, ImportReceipt, Product, Warehouse } = db;

async function run() {
  const transaction = await sequelize.transaction();
  try {
    // 1. Lấy toàn bộ dòng trong bảng Inventory
    const inventories = await Inventory.findAll({
      include: [
        { model: Product, attributes: ['product_code', 'product_name'] },
        { model: Warehouse, attributes: ['warehouse_name'] }
      ],
      transaction
    });

    console.log(`Bắt đầu xử lý tính toán lại đơn giá bình quân (WAC) cho ${inventories.length} bản ghi tồn kho...`);

    let countSuccess = 0;
    let countNoNcc = 0;
    const noNccWarnings = [];

    for (const inv of inventories) {
      const { product_id, warehouse_id, Product: product, Warehouse: warehouse } = inv;

      // 2. Lấy toàn bộ dòng import_details cho cặp (product_id, warehouse_id)
      // Sắp xếp theo thời gian nhập kho tăng dần để mô phỏng đúng trình tự thời gian
      const details = await ImportDetail.findAll({
        where: { product_id },
        include: [
          {
            model: ImportReceipt,
            where: { warehouse_id },
            required: true
          }
        ],
        order: [
          [ImportReceipt, 'import_date', 'ASC'],
          [ImportReceipt, 'createdAt', 'ASC'],
          ['import_detail_id', 'ASC']
        ],
        transaction
      });

      let running_qty = 0;
      let running_avg_price = 0;
      let has_ncc = false;

      for (const detail of details) {
        const qty = parseInt(detail.quantity, 10) || 0;
        const price = parseFloat(detail.unit_price || 0);
        const type = detail.ImportReceipt?.import_type; // DB ENUM: 'Từ NCC', 'Từ xưởng', 'Xưởng trả lại'

        if (type === 'Từ NCC') {
          has_ncc = true;
          if (running_qty + qty > 0) {
            const next_avg = (running_qty * running_avg_price + qty * price) / (running_qty + qty);
            running_avg_price = next_avg;
          }
          running_qty += qty;
        } else {
          // 'Từ xưởng' hoặc 'Xưởng trả lại'
          // Vẫn cộng dồn số lượng nhưng không cập nhật đơn giá bình quân
          running_qty += qty;
        }
      }

      if (has_ncc) {
        // Làm tròn avg_unit_price đến 2 chữ số thập phân khi lưu
        const final_avg_price = parseFloat(running_avg_price.toFixed(2));
        inv.avg_unit_price = final_avg_price;
        await inv.save({ transaction });
        countSuccess++;
      } else {
        // Giữ nguyên avg_unit_price = 0 nếu không có dòng NCC nào
        inv.avg_unit_price = 0;
        await inv.save({ transaction });
        countNoNcc++;
        noNccWarnings.push({
          product_code: product?.product_code || 'N/A',
          product_name: product?.product_name || 'N/A',
          warehouse_name: warehouse?.warehouse_name || 'N/A',
          product_id,
          warehouse_id
        });
      }
    }

    // Commit transaction
    await transaction.commit();

    // 4. In cảnh báo ra console danh sách sản phẩm chỉ toàn nhập xưởng/trả lại
    if (noNccWarnings.length > 0) {
      console.log('\n⚠️ CẢNH BÁO: Các sản phẩm không có bất kỳ phiếu nhập nào từ Nhà cung cấp (NCC) - Đã giữ nguyên avg_unit_price = 0:');
      noNccWarnings.forEach((item, index) => {
        console.log(`  ${index + 1}. [Mã SKU: ${item.product_code}] ${item.product_name} - Kho: ${item.warehouse_name} (product_id: ${item.product_id}, warehouse_id: ${item.warehouse_id})`);
      });
    }

    // 5. Tính toán tổng giá trị tồn kho toàn hệ thống sau khi backfill
    const allInventories = await Inventory.findAll();
    let totalValue = 0;
    for (const item of allInventories) {
      totalValue += (parseInt(item.quantity, 10) || 0) * parseFloat(item.avg_unit_price || 0);
    }

    console.log('\n================================================================');
    console.log('✅ CHẠY SCRIPT BACKFILLavg_unit_price HOÀN TẤT THÀNH CÔNG!');
    console.log(`- Số sản phẩm tính được đơn giá bình quân (có nhập NCC): ${countSuccess}`);
    console.log(`- Số sản phẩm giữ giá 0 (chỉ nhập xưởng, không có NCC): ${countNoNcc}`);
    console.log(`- Tổng giá trị tồn kho toàn hệ thống sau backfill: ${totalValue.toLocaleString('vi-VN')} ₫`);
    console.log('================================================================\n');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ LỖI TRONG QUÁ TRÌNH BACKFILL, ĐÃ ROLLBACK TOÀN BỘ TRANSACTIONS:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

run();
