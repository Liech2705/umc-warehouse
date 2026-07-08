require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Category,
  Product,
  Supplier,
  Warehouse,
  Workshop,
  Location,
  ImportReceipt,
  ImportDetail,
  ExportReceipt,
  ExportDetail,
  Inventory,
  StockHistory,
  DefectiveItem,
  ScrapReceipt,
  InventoryCheck,
  InventoryCheckDetail,
} = require('../src/models');

async function runSeed() {
  console.log('🔄 Đang kết nối Cơ sở dữ liệu...');
  await sequelize.authenticate();
  console.log('✅ Kết nối Cơ sở dữ liệu thành công!');

  console.log('🧹 Đang dọn dẹp các bảng dữ liệu cũ (ngoại trừ Users)...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await ScrapReceipt.destroy({ truncate: true });
  await DefectiveItem.destroy({ truncate: true });
  await InventoryCheckDetail.destroy({ truncate: true });
  await InventoryCheck.destroy({ truncate: true });
  await StockHistory.destroy({ truncate: true });
  await Inventory.destroy({ truncate: true });
  await ExportDetail.destroy({ truncate: true });
  await ExportReceipt.destroy({ truncate: true });
  await ImportDetail.destroy({ truncate: true });
  await ImportReceipt.destroy({ truncate: true });
  await Product.destroy({ truncate: true });
  await Location.destroy({ truncate: true });
  await Category.destroy({ truncate: true });
  await Supplier.destroy({ truncate: true });
  await Warehouse.destroy({ truncate: true });
  await Workshop.destroy({ truncate: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Đã làm sạch dữ liệu cũ!');

  // --- 1. Tạo hoặc kiểm tra Users ---
  console.log('👥 Đang kiểm tra người dùng...');
  let admin = await User.findOne({ where: { username: 'admin' } });
  let thukho = await User.findOne({ where: { username: 'thukho' } });
  let quanly = await User.findOne({ where: { username: 'quanly' } });

  const passwordHash = await bcrypt.hash('123456', 10);

  if (!admin) {
    admin = await User.create({
      username: 'admin',
      password: passwordHash,
      full_name: 'Phạm Minh Admin',
      role: 'Admin',
    });
  }
  if (!thukho) {
    thukho = await User.create({
      username: 'thukho',
      password: passwordHash,
      full_name: 'Nguyễn Văn Thủ Kho',
      role: 'ThuKho',
    });
  }
  if (!quanly) {
    quanly = await User.create({
      username: 'quanly',
      password: passwordHash,
      full_name: 'Lê Thị Quản Lý',
      role: 'QuanLy',
    });
  }
  console.log('✅ Người dùng hệ thống đã sẵn sàng!');

  // --- 2. Tạo Categories (5 nhóm hàng) ---
  console.log('📁 Đang tạo danh mục Nhóm Hàng...');
  const categoriesData = [
    { category_name: 'Vi mạch IC' },
    { category_name: 'Tụ điện & Điện trở' },
    { category_name: 'Bảng mạch PCB' },
    { category_name: 'Cáp & Đầu nối connector' },
    { category_name: 'Màn hình & Cảm biến' },
  ];
  const categories = await Category.bulkCreate(categoriesData);
  console.log(`✅ Đã tạo ${categories.length} nhóm hàng.`);

  // --- 3. Tạo Suppliers (5 nhà cung cấp) ---
  console.log('🤝 Đang tạo danh sách Nhà Cung Cấp...');
  const suppliersData = [
    {
      supplier_name: 'Công ty Cổ phần Bán dẫn UMC',
      contact_person: 'Mr. Kang',
      phone: '0912345678',
      email: 'kang@umc.com',
      address: 'KCN Quế Võ, Bắc Ninh',
    },
    {
      supplier_name: 'Tập đoàn Điện tử Murata Việt Nam',
      contact_person: 'Mr. Tanaka',
      phone: '0243987654',
      email: 'sales@murata.vn',
      address: 'KCN Thăng Long, Hà Nội',
    },
    {
      supplier_name: 'Nhà phân phối linh kiện Mouser Electronics',
      contact_person: 'Mrs. Hạnh',
      phone: '0988776655',
      email: 'hanh.mouser@mouser.com',
      address: 'Quận 1, TP. Hồ Chí Minh',
    },
    {
      supplier_name: 'Công ty TNHH PCB Tech',
      contact_person: 'Mr. Dũng',
      phone: '0904123321',
      email: 'info@pcbtech.vn',
      address: 'KCN VSIP Hải Phòng',
    },
    {
      supplier_name: 'Điện tử Minh Hà',
      contact_person: 'Mr. Hà',
      phone: '0966554433',
      email: 'contact@banlinhkien.vn',
      address: 'Đồng Đa, Hà Nội',
    },
  ];
  const suppliers = await Supplier.bulkCreate(suppliersData);
  console.log(`✅ Đã tạo ${suppliers.length} nhà cung cấp.`);

  // --- 4. Tạo Warehouses (3 kho hàng) ---
  console.log('🏢 Đang tạo danh sách Kho Hàng...');
  const warehousesData = [
    { warehouse_name: 'Kho nguyên vật liệu A', location: 'Khu A - Tầng 1' },
    { warehouse_name: 'Kho linh kiện B', location: 'Khu B - Tầng 2' },
    { warehouse_name: 'Kho thành phẩm C', location: 'Khu C - Tầng 1' },
  ];
  const warehouses = await Warehouse.bulkCreate(warehousesData);
  console.log(`✅ Đã tạo ${warehouses.length} kho hàng.`);

  // --- 5. Tạo Locations (Vị trí kệ trong mỗi kho) ---
  console.log('📍 Đang tạo vị trí cụ thể (Rack/Shelf)...');
  const locations = [];
  for (const wh of warehouses) {
    const locCodes = ['R1-S1', 'R1-S2', 'R2-S1', 'R2-S2'];
    for (const code of locCodes) {
      const loc = await Location.create({
        warehouse_id: wh.warehouse_id,
        location_code: `${wh.warehouse_name.slice(-1)}-${code}`,
        description: `Kệ hàng tầng ${code.slice(-1)}`,
      });
      locations.push(loc);
    }
  }
  console.log(`✅ Đã tạo ${locations.length} vị trí lưu trữ kệ hàng.`);

  // --- 6. Tạo Workshops (3 xưởng sản xuất) ---
  console.log('🏭 Đang tạo danh sách Xưởng Sản Xuất...');
  const workshopsData = [
    { workshop_name: 'Xưởng sản xuất SMT 1', manager_name: 'Nguyễn Văn Hùng' },
    { workshop_name: 'Xưởng lắp ráp thành phẩm SMT 2', manager_name: 'Trần Quốc Bảo' },
    { workshop_name: 'Xưởng kiểm định chất lượng QA', manager_name: 'Phạm Minh Tuấn' },
  ];
  const workshops = await Workshop.bulkCreate(workshopsData);
  console.log(`✅ Đã tạo ${workshops.length} xưởng sản xuất.`);

  // --- 7. Tạo 30 Sản phẩm đa dạng ---
  console.log('📦 Đang tạo danh mục 30 Sản Phẩm mẫu...');
  const productsData = [
    // IC
    {
      product_code: 'IC-STM32F103',
      product_name: 'Vi điều khiển STM32F103C8T6',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 150,
      description: 'Cortex-M3 32-bit MCU, 64KB Flash',
    },
    {
      product_code: 'IC-ESP32-WROOM',
      product_name: 'Module Wifi/Bluetooth ESP32-WROOM-32D',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 200,
      description: 'ESP32 Wi-Fi + BT + BLE MCU module',
    },
    {
      product_code: 'IC-LM358',
      product_name: 'IC Khuếch đại thuật toán LM358',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 500,
      description: 'Dual Operational Amplifier SOP-8',
    },
    {
      product_code: 'IC-NE555',
      product_name: 'IC Tạo xung nhịp NE555D',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 300,
      description: 'Precision timer IC SOP-8',
    },
    {
      product_code: 'IC-MAX3232',
      product_name: 'IC Giao tiếp MAX3232CSE',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 100,
      description: '3V to 5.5V Multichannel RS-232 Line Driver',
    },
    {
      product_code: 'IC-CH340G',
      product_name: 'IC Chuyển đổi USB-to-UART CH340G',
      category_id: categories[0].category_id,
      unit: 'Cái',
      min_stock: 250,
      description: 'USB to serial port chip SOP-16',
    },

    // Tụ điện & Điện trở
    {
      product_code: 'CAP-10UF-50V',
      product_name: 'Tụ hóa 10uF 50V SMD',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 1000,
      description: 'Aluminum Electrolytic Capacitor',
    },
    {
      product_code: 'CAP-100NF-50V',
      product_name: 'Tụ gốm 100nF (0.1uF) 0805',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 2000,
      description: 'Ceramic Capacitor Multilayer',
    },
    {
      product_code: 'RES-10K-0805',
      product_name: 'Điện trở dán 10K Ohm 1/8W 0805',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 5000,
      description: 'Thick Film Chip Resistor 5%',
    },
    {
      product_code: 'RES-1K-0805',
      product_name: 'Điện trở dán 1K Ohm 1/8W 0805',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 4000,
      description: 'Thick Film Chip Resistor 1%',
    },
    {
      product_code: 'RES-220-0805',
      product_name: 'Điện trở dán 220 Ohm 0805',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 3000,
      description: 'Thick Film Chip Resistor',
    },
    {
      product_code: 'CAP-22PF-50V',
      product_name: 'Tụ gốm dán 22pF 0603',
      category_id: categories[1].category_id,
      unit: 'Cái',
      min_stock: 1500,
      description: 'NP0 Ceramic Capacitor',
    },

    // PCB
    {
      product_code: 'PCB-UMC-CTRL',
      product_name: 'Bạch in PCB điều khiển UMC-V1',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 50,
      description: 'FR4 Double-sided PCB, 1.6mm thickness',
    },
    {
      product_code: 'PCB-POWER-SPLY',
      product_name: 'Bảng mạch nguồn PCB Power V2',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 80,
      description: '4-layer PCB for power supply',
    },
    {
      product_code: 'PCB-DISPLAY-ADAP',
      product_name: 'Mạch chuyển đổi hiển thị LCD PCB',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 40,
      description: 'Adapter board for LCD interfaces',
    },
    {
      product_code: 'PCB-IOT-GATE',
      product_name: 'Bo mạch Gateway IoT PCB',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 60,
      description: 'Gateway motherboard FR4',
    },
    {
      product_code: 'PCB-LED-PANEL',
      product_name: 'Mạch in ma trận LED PCB 16x32',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 100,
      description: 'Aluminium PCB for LED panels',
    },
    {
      product_code: 'PCB-TEST-BOARD',
      product_name: 'Bạch PCB Test vạn năng SMT',
      category_id: categories[2].category_id,
      unit: 'Tấm',
      min_stock: 120,
      description: 'Universal prototyping SMT PCB board',
    },

    // Cáp & Đầu nối connector
    {
      product_code: 'CONN-XH2.54-4P',
      product_name: 'Đầu nối Connector XH2.54 4-Pin',
      category_id: categories[3].category_id,
      unit: 'Cái',
      min_stock: 1200,
      description: 'JST XH 2.54mm wire-to-board connector',
    },
    {
      product_code: 'CONN-USB-C',
      product_name: 'Cổng cắm USB Type-C 16-Pin SMT',
      category_id: categories[3].category_id,
      unit: 'Cái',
      min_stock: 800,
      description: 'Female USB-C receptacle socket',
    },
    {
      product_code: 'CABLE-FFC-10PIN',
      product_name: 'Cáp dẹt FFC 10-Pin bước 0.5mm',
      category_id: categories[3].category_id,
      unit: 'Sợi',
      min_stock: 400,
      description: 'Flexible flat ribbon cable',
    },
    {
      product_code: 'CONN-HEADER-2.54',
      product_name: 'Hàng rào đực Pin Header 1x40 2.54mm',
      category_id: categories[3].category_id,
      unit: 'Sợi',
      min_stock: 600,
      description: 'Male straight single-row pin header',
    },
    {
      product_code: 'CABLE-USB-MICRO',
      product_name: 'Cáp nạp chương trình Micro USB 1m',
      category_id: categories[3].category_id,
      unit: 'Sợi',
      min_stock: 200,
      description: 'USB-A to Micro-B data cable',
    },
    {
      product_code: 'CONN-RJ45-LED',
      product_name: 'Cổng mạng LAN RJ45 có đèn báo',
      category_id: categories[3].category_id,
      unit: 'Cái',
      min_stock: 350,
      description: '8P8C shielded RJ45 connector with LED',
    },

    // Màn hình & Cảm biến
    {
      product_code: 'DISP-LCD1602-B',
      product_name: 'Màn hình hiển thị LCD 16x2 nền xanh',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 120,
      description: 'Character LCD display module',
    },
    {
      product_code: 'DISP-OLED-0.96',
      product_name: 'Màn hình hiển thị OLED 0.96 inch I2C',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 180,
      description: '128x64 pixels OLED module',
    },
    {
      product_code: 'SENS-DHT22',
      product_name: 'Cảm biến nhiệt độ & độ ẩm DHT22',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 150,
      description: 'AM2302 capacitive humidity/temp sensor',
    },
    {
      product_code: 'SENS-HCSR04',
      product_name: 'Cảm biến siêu âm đo khoảng cách HC-SR04',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 100,
      description: 'Ultrasonic range finder module',
    },
    {
      product_code: 'SENS-LDR',
      product_name: 'Cảm biến quang trở LDR 5mm GL5516',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 800,
      description: 'Light dependent resistor',
    },
    {
      product_code: 'SENS-MPU6050',
      product_name: 'Cảm biến gia tốc & con quay MPU6050',
      category_id: categories[4].category_id,
      unit: 'Cái',
      min_stock: 130,
      description: '3-axis gyroscope + 3-axis accelerometer',
    },
  ];
  const products = await Product.bulkCreate(productsData);
  console.log(`✅ Đã tạo ${products.length} sản phẩm.`);

  // Helper để tạo ngày ngẫu nhiên trong 60 ngày qua
  const getRandomDateInLast60Days = () => {
    const d = new Date();
    const daysAgo = Math.floor(Math.random() * 60);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return d;
  };

  // --- 8. Tạo 15 Phiếu Nhập Kho rải đều trong 2 tháng ---
  console.log('📥 Đang lập 15 Phiếu Nhập Kho mẫu...');
  const imports = [];
  for (let i = 1; i <= 15; i++) {
    const importDate = getRandomDateInLast60Days();
    const type = i % 3 === 0 ? 'XUONG' : i % 3 === 1 ? 'NCC' : 'TRA_LAI';
    const wh = warehouses[Math.floor(Math.random() * warehouses.length)];
    const supp = type === 'NCC' ? suppliers[Math.floor(Math.random() * suppliers.length)] : null;
    const ws = type !== 'NCC' ? workshops[Math.floor(Math.random() * workshops.length)] : null;

    const receipt = await ImportReceipt.create({
      import_code: `PNK-${importDate.getFullYear()}${String(importDate.getMonth() + 1).padStart(2, '0')}${String(importDate.getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
      import_type: type === 'NCC' ? 'Từ NCC' : type === 'XUONG' ? 'Từ xưởng' : 'Xưởng trả lại',
      supplier_id: supp ? supp.supplier_id : null,
      workshop_id: ws ? ws.workshop_id : null,
      warehouse_id: wh.warehouse_id,
      user_id: thukho.user_id,
      import_date: importDate,
      note: `Phiếu nhập hàng mẫu số ${i} tự động khởi tạo`,
    });

    // Thêm 1-3 chi tiết sản phẩm cho mỗi phiếu
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    const selectedLocs = locations.filter((l) => l.warehouse_id === wh.warehouse_id);

    for (let j = 0; j < itemsCount; j++) {
      const prod = shuffledProducts[j];
      const qty = Math.floor(Math.random() * 300) + 100; // 100 - 400
      const price = Math.floor(Math.random() * 80000) + 10000; // 10,000đ - 90,000đ
      const loc = selectedLocs[Math.floor(Math.random() * selectedLocs.length)];
      const batch = `LOT-${importDate.getFullYear().toString().slice(-2)}${String(importDate.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
      const expDate = new Date(importDate);
      expDate.setMonth(expDate.getMonth() + 24); // HSD 2 năm

      await ImportDetail.create({
        import_id: receipt.import_id,
        product_id: prod.product_id,
        quantity: qty,
        unit_price: price,
        batch_code: batch,
        expiry_date: expDate,
        location_id: loc ? loc.location_id : null,
      });

      // Cập nhật tồn kho
      let inv = await Inventory.findOne({
        where: {
          product_id: prod.product_id,
          warehouse_id: wh.warehouse_id,
          location_id: loc ? loc.location_id : null,
        },
      });

      if (inv) {
        inv.quantity += qty;
        await inv.save();
      } else {
        inv = await Inventory.create({
          product_id: prod.product_id,
          warehouse_id: wh.warehouse_id,
          location_id: loc ? loc.location_id : null,
          quantity: qty,
        });
      }

      // Ghi lịch sử
      await StockHistory.create({
        product_id: prod.product_id,
        warehouse_id: wh.warehouse_id,
        change_type: 'IMPORT',
        reference_id: receipt.import_id,
        quantity_change: qty,
        user_id: thukho.user_id,
        created_at: importDate,
      });
    }
    imports.push(receipt);
  }
  console.log(`✅ Đã tạo 15 phiếu nhập kho & đồng bộ hóa tồn kho.`);

  // --- 9. Tạo 20 Phiếu Xuất Kho rải đều trong 2 tháng ---
  console.log('📤 Đang lập 20 Phiếu Xuất Kho mẫu...');
  let exportIndex = 1;
  while (exportIndex <= 20) {
    const exportDate = getRandomDateInLast60Days();
    const type = exportIndex % 2 === 0 ? 'XUONG_SX' : exportIndex % 3 === 0 ? 'BAN' : 'TRA_NCC';
    const ws = type === 'XUONG_SX' ? workshops[Math.floor(Math.random() * workshops.length)] : null;

    // Chọn ngẫu nhiên kho hàng để xuất
    const wh = warehouses[Math.floor(Math.random() * warehouses.length)];

    // Tìm xem kho này có mặt hàng nào tồn không
    const availableInventory = await Inventory.findAll({
      where: {
        warehouse_id: wh.warehouse_id,
        quantity: { [sequelize.Sequelize.Op.gt]: 10 },
      },
    });

    if (availableInventory.length === 0) {
      // Bỏ qua kho này nếu không có hàng và thử kho khác
      continue;
    }

    const receipt = await ExportReceipt.create({
      export_code: `PXK-${exportDate.getFullYear()}${String(exportDate.getMonth() + 1).padStart(2, '0')}${String(exportDate.getDate()).padStart(2, '0')}-${String(exportIndex).padStart(3, '0')}`,
      export_type:
        type === 'XUONG_SX' ? 'Xuất cho xưởng SX' : type === 'BAN' ? 'Xuất bán' : 'Xuất trả NCC',
      workshop_id: ws ? ws.workshop_id : null,
      warehouse_id: wh.warehouse_id,
      user_id: thukho.user_id,
      export_date: exportDate,
      note: `Phiếu xuất kho mẫu số ${exportIndex} tự động lập`,
    });

    // Lấy 1-2 mặt hàng từ danh sách tồn khả dụng để xuất
    const itemsToExportCount = Math.min(
      availableInventory.length,
      Math.floor(Math.random() * 2) + 1
    );
    const shuffledInv = [...availableInventory].sort(() => 0.5 - Math.random());

    for (let j = 0; j < itemsToExportCount; j++) {
      const invRecord = shuffledInv[j];
      // Xuất lượng nhỏ hơn tồn để tránh lỗi
      const qtyToExport = Math.floor(invRecord.quantity * 0.4) + 1;

      await ExportDetail.create({
        export_id: receipt.export_id,
        product_id: invRecord.product_id,
        quantity: qtyToExport,
        batch_code: 'LOT-DEMO-EXP',
      });

      // Cập nhật kho
      invRecord.quantity -= qtyToExport;
      await invRecord.save();

      // Ghi lịch sử
      await StockHistory.create({
        product_id: invRecord.product_id,
        warehouse_id: wh.warehouse_id,
        change_type: 'EXPORT',
        reference_id: receipt.export_id,
        quantity_change: -qtyToExport,
        user_id: thukho.user_id,
        created_at: exportDate,
      });
    }
    exportIndex++;
  }
  console.log(`✅ Đã tạo 20 phiếu xuất kho thành công.`);

  // --- 10. Tạo 5 bản ghi hàng lỗi ở đủ 3 trạng thái ---
  console.log('⚠️ Đang ghi nhận 5 trường hợp Hàng Lỗi / Cách ly...');
  const defectiveData = [
    {
      product_id: products[0].product_id,
      warehouse_id: warehouses[0].warehouse_id,
      source_type: 'Lỗi khi nhập kho',
      quantity: 5,
      reason: 'Gãy chân vi điều khiển khi mở hộp',
      status: 'Chờ xử lý',
      reported_by: thukho.user_id,
    },
    {
      product_id: products[1].product_id,
      warehouse_id: warehouses[1].warehouse_id,
      source_type: 'Xưởng trả lỗi',
      workshop_id: workshops[0].workshop_id,
      quantity: 12,
      reason: 'IC không phản hồi nạp code tại dây chuyền SMT',
      status: 'Chờ xử lý',
      reported_by: thukho.user_id,
    },
    {
      product_id: products[6].product_id,
      warehouse_id: warehouses[0].warehouse_id,
      source_type: 'Tồn kho phát hiện hỏng',
      quantity: 50,
      reason: 'Chân tụ bị oxy hóa nặng do ẩm mốc',
      status: 'Đã hủy',
      reported_by: thukho.user_id,
    },
    {
      product_id: products[12].product_id,
      warehouse_id: warehouses[1].warehouse_id,
      source_type: 'Lỗi khi nhập kho',
      quantity: 2,
      reason: 'Bảng mạch nứt gãy cơ học',
      status: 'Trả NCC',
      reported_by: thukho.user_id,
    },
    {
      product_id: products[20].product_id,
      warehouse_id: warehouses[2].warehouse_id,
      source_type: 'Xưởng trả lỗi',
      workshop_id: workshops[1].workshop_id,
      quantity: 20,
      reason: 'Cáp dẹt bị dập gập gãy nếp dẫn điện',
      status: 'Chờ xử lý',
      reported_by: thukho.user_id,
    },
  ];

  for (const item of defectiveData) {
    const record = await DefectiveItem.create({
      ...item,
      reported_at: new Date(),
    });

    // Trừ kho khả dụng của sản phẩm lỗi
    const inv = await Inventory.findOne({
      where: {
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
      },
    });

    if (inv) {
      inv.quantity = Math.max(0, inv.quantity - item.quantity);
      await inv.save();
    }

    // Ghi stock history cách ly
    await StockHistory.create({
      product_id: item.product_id,
      warehouse_id: item.warehouse_id,
      change_type: 'DEFECTIVE_HOLD',
      reference_id: record.defective_id,
      quantity_change: -item.quantity,
      user_id: thukho.user_id,
    });

    // Nếu trạng thái là 'Đã hủy', tạo thêm ScrapReceipt
    if (item.status === 'Đã hủy') {
      await ScrapReceipt.create({
        defective_id: record.defective_id,
        approved_by: admin.user_id,
        scrap_date: new Date(),
        note: 'Đã phê duyệt hủy bỏ tiêu hủy thực tế.',
      });
    }
  }
  console.log(`✅ Đã tạo 5 hàng lỗi và phê duyệt hủy bỏ 1 mục.`);

  // --- 11. Tạo 2 phiếu kiểm kê đã hoàn tất có chênh lệch ---
  console.log('🔍 Đang tạo 2 Phiếu Kiểm Kê đã hoàn thành & đối chiếu...');
  for (let k = 1; k <= 2; k++) {
    const wh = warehouses[k - 1];
    const checkSheet = await InventoryCheck.create({
      warehouse_id: wh.warehouse_id,
      check_date: new Date(),
      user_id: thukho.user_id,
      status: 'Đã đối chiếu',
    });

    // Lấy 3 sản phẩm trong kho này để tạo chi tiết kiểm kê
    const invItems = await Inventory.findAll({
      where: { warehouse_id: wh.warehouse_id },
      limit: 3,
    });

    for (let m = 0; m < invItems.length; m++) {
      const inv = invItems[m];
      const sysQty = inv.quantity;
      // Chênh lệch ngẫu nhiên +5 hoặc -2
      const diff = m === 0 ? 5 : m === 1 ? -2 : 0;
      const actQty = sysQty + diff;

      await InventoryCheckDetail.create({
        check_id: checkSheet.check_id,
        product_id: inv.product_id,
        system_quantity: sysQty,
        actual_quantity: actQty,
        difference: diff,
      });

      // Cập nhật tồn kho thực tế khớp kiểm kê
      inv.quantity = actQty;
      await inv.save();

      // Lưu StockHistory điều chỉnh
      if (diff !== 0) {
        await StockHistory.create({
          product_id: inv.product_id,
          warehouse_id: wh.warehouse_id,
          change_type: 'ADJUSTMENT',
          reference_id: checkSheet.check_id,
          quantity_change: diff,
          user_id: thukho.user_id,
        });
      }
    }
  }
  console.log(`✅ Đã lập và đối chiếu hoàn tất 2 phiếu kiểm kê.`);

  console.log('\n🌟🌟🌟 TẤT CẢ DỮ LIỆU DEMO ĐÃ ĐƯỢC SEED THÀNH CÔNG! 🌟🌟🌟');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Lỗi khi seeding:', err);
  process.exit(1);
});
