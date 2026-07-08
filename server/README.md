# UMC Warehouse Server API

Backend quản lý kho dựa trên Node.js + Express và Sequelize (MySQL).

## Cấu hình môi trường

1. Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Cập nhật các thông số kết nối Database trong file `.env` và `config/config.json`.

## Hướng dẫn Database (Sequelize CLI)

### 1. Tạo bảng (Run Migrations)
Để tạo cấu trúc 17 bảng trong database theo đúng thứ tự:
```bash
npx sequelize-cli db:migrate
```

### 2. Khởi tạo dữ liệu mẫu (Run Seeders)
Để nạp dữ liệu mẫu bao gồm Users, Categories, Suppliers, Warehouses, Workshops, Products:
```bash
npx sequelize-cli db:seed:all
```

### 3. Hoàn tác dữ liệu mẫu (Undo Seeders)
Để xóa bỏ dữ liệu mẫu đã nạp:
```bash
npx sequelize-cli db:seed:undo:all
```

### 4. Xóa cấu trúc bảng (Rollback Migrations)
Để xóa toàn bộ các bảng trong database:
```bash
npx sequelize-cli db:migrate:undo:all
```

## Chạy ứng dụng

- Chạy chế độ Development (Nodemon tự restart):
  ```bash
  npm run dev
  ```
- Chạy chế độ Production:
  ```bash
  npm start
  ```
