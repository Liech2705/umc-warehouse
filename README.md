# 🏭 UMC Warehouse Management System

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-≥20.0-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" />
</p>

<p align="center">
  Hệ thống quản lý kho hàng toàn diện dành cho doanh nghiệp sản xuất — theo dõi tồn kho, nhập/xuất hàng, kiểm kê và định giá bình quân gia quyền (WAC) theo thời gian thực.
</p>

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Scripts tiện ích](#-scripts-tiện-ích)
- [Deploy](#-deploy)

---

## 🎯 Tổng quan

**UMC Warehouse Management System** là ứng dụng web full-stack giúp quản lý hoạt động kho hàng của doanh nghiệp sản xuất điện tử. Hệ thống cho phép theo dõi hàng hóa từ lúc nhập kho từ nhà cung cấp (NCC), lưu chuyển qua các xưởng sản xuất, đến khi xuất thành phẩm — tất cả kết hợp với cơ chế định giá tồn kho theo phương pháp **bình quân gia quyền (Weighted Average Cost)**.

---

## ✨ Tính năng chính

### 📦 Quản lý tồn kho
- Theo dõi tồn kho theo từng sản phẩm và từng kho riêng biệt
- Hiển thị **đơn giá bình quân gia quyền** (WAC) và **tổng giá trị tồn** theo thời gian thực
- API tổng hợp giá trị tồn kho toàn hệ thống, phân theo kho

### 📥 Nhập kho
- Tạo phiếu nhập từ **nhà cung cấp (NCC)**, từ **xưởng sản xuất** hoặc **xưởng trả lại**
- Tự động tính lại đơn giá bình quân gia quyền mỗi khi nhập hàng từ NCC
- Ghi nhận lịch sử biến động tồn kho (StockHistory) với giá trị mỗi lần nhập

### 📤 Xuất kho
- Tạo phiếu xuất đến xưởng sản xuất hoặc trả nhà cung cấp
- Ghi nhận giá trị hàng xuất dựa trên đơn giá bình quân tại thời điểm xuất
- Kiểm tra tồn kho đủ trước khi cho phép xuất

### 🔍 Kiểm kê kho
- Tạo và phê duyệt phiếu kiểm kê định kỳ
- Điều chỉnh tồn kho thực tế so với sổ sách sau kiểm kê

### ⚠️ Quản lý hàng lỗi
- Ghi nhận hàng lỗi, báo hỏng từ xưởng sản xuất
- Lập phiếu hủy kho hoặc trả lại nhà cung cấp

### 📊 Dashboard & Báo cáo
- Tổng quan: số lượng sản phẩm, kho, nhà cung cấp, **tổng giá trị tồn kho toàn hệ thống**
- Biểu đồ nhập/xuất kho theo thời gian (Recharts)
- Xuất báo cáo ra file Excel (ExcelJS)

### 👥 Quản lý người dùng & Phân quyền
- Xác thực JWT, mã hóa mật khẩu bcrypt
- Phân quyền theo vai trò (Admin / Nhân viên kho)
- Khóa/mở khóa tài khoản người dùng

---

## 🛠️ Công nghệ sử dụng

### Frontend (`client/`)
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 6.0.5 | Build tool & Dev server |
| Ant Design | 5.22.5 | Component library |
| TanStack Query | 5.62.10 | Server state management & Caching |
| React Router DOM | 6.28.1 | Client-side routing |
| Axios | 1.7.9 | HTTP client |
| Recharts | 2.15.0 | Biểu đồ thống kê |
| Day.js | 1.11.13 | Xử lý ngày giờ |

### Backend (`server/`)
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Node.js | ≥ 20.0.0 | Runtime |
| Express | 4.21.2 | Web framework |
| Sequelize | 6.37.8 | ORM |
| MySQL2 | 3.11.5 | Database driver |
| JWT (jsonwebtoken) | 9.0.2 | Xác thực |
| bcryptjs | 2.4.3 | Mã hóa mật khẩu |
| ExcelJS | 4.4.0 | Xuất file Excel |
| Morgan | 1.10.0 | HTTP request logging |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (React + Vite)              │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │  React   │  │ TanStack Query│  │  Ant Design  │  │
│  │  Router  │  │  (Caching)    │  │  Components  │  │
│  └──────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │ HTTP / REST API
                          │ (Axios + JWT)
┌─────────────────────────▼───────────────────────────┐
│                   SERVER (Express.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Routes &   │  │  Controllers │  │ Middleware │  │
│  │  API Layers  │  │  (Business   │  │ (Auth/JWT) │  │
│  │              │  │   Logic)     │  │            │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │              Sequelize ORM                   │    │
│  └──────────────────────┬───────────────────────┘    │
└───────────────────────────────────────────────────── ┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                  MySQL Database                      │
│  (Users, Products, Warehouses, Inventory,           │
│   Import/Export Receipts, StockHistory, ...)        │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
WareHouse-Management/
├── .claude/                     # Quy tắc & hướng dẫn phát triển (AI)
│   ├── memory.md
│   └── rules/
│       ├── tech-defaults.md
│       └── workflow.md
├── CLAUDE.md                    # Tóm tắt dự án cho AI assistant
├── README.md                    # File này
└── umc-warehouse/
    ├── client/                  # React + Vite frontend
    │   ├── public/
    │   ├── src/
    │   │   ├── api/             # Axios client & API calls
    │   │   ├── components/      # Shared UI components
    │   │   ├── context/         # React Context (Auth)
    │   │   ├── hooks/           # Custom hooks
    │   │   ├── pages/           # Page components (theo module)
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── imports/
    │   │   │   ├── exports/
    │   │   │   ├── inventory/
    │   │   │   ├── products/
    │   │   │   ├── categories/
    │   │   │   ├── suppliers/
    │   │   │   ├── warehouses/
    │   │   │   ├── workshops/
    │   │   │   ├── locations/
    │   │   │   ├── stock-history/
    │   │   │   ├── inventory-checks/
    │   │   │   ├── defective-items/
    │   │   │   └── users/
    │   │   └── utils/           # Helper functions (formatCurrency...)
    │   ├── .env.example
    │   ├── vercel.json          # Cấu hình deploy Vercel (SPA routing)
    │   └── vite.config.js
    │
    └── server/                  # Express.js backend
        ├── src/
        │   ├── app.js           # Express app setup
        │   ├── config/          # Database config
        │   ├── controllers/     # Request handlers
        │   ├── middlewares/     # Auth, error handling
        │   ├── models/          # Sequelize models
        │   ├── routes/          # API route definitions
        │   └── services/        # Business logic services
        ├── migrations/          # Sequelize database migrations
        ├── scripts/
        │   ├── demoSeed.js      # Seed dữ liệu mẫu
        │   └── backfillAvgPrice.js  # Tính lại WAC từ dữ liệu lịch sử
        ├── .env.example
        └── server.js            # Entry point
```

---

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- **Node.js** ≥ 20.0.0
- **MySQL** ≥ 8.0 (hoặc MariaDB tương thích)
- **npm** ≥ 10.0.0 hoặc **yarn**

---

### 1. Clone repository

```bash
git clone https://github.com/<your-username>/WareHouse-Management.git
cd WareHouse-Management/umc-warehouse
```

---

### 2. Cài đặt Backend

```bash
cd server
npm install
```

Tạo file `.env` từ file mẫu và điền thông tin kết nối database:

```bash
cp .env.example .env
```

```env
# server/.env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=umc_warehouse
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

Chạy migration để tạo các bảng trong database:

```bash
npx sequelize-cli db:migrate
```

*(Tùy chọn)* Seed dữ liệu mẫu để kiểm tra:

```bash
node scripts/demoSeed.js
```

Khởi động server:

```bash
npm run dev        # Development mode (nodemon)
npm start          # Production mode
```

Server chạy tại: `http://localhost:5000`

---

### 3. Cài đặt Frontend

```bash
cd ../client
npm install
```

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

```env
# client/.env
VITE_API_URL=http://localhost:5000/api
```

Khởi động client:

```bash
npm run dev
```

Client chạy tại: `http://localhost:5173`

---

## 🔐 Biến môi trường

### Backend (`server/.env`)

| Biến | Mô tả | Giá trị mặc định |
|---|---|---|
| `PORT` | Port chạy server | `5000` |
| `NODE_ENV` | Môi trường (`development` / `production`) | `development` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_NAME` | Tên database | — |
| `DB_USER` | Username MySQL | — |
| `DB_PASSWORD` | Password MySQL | — |
| `JWT_SECRET` | Khóa bí mật ký JWT | — |
| `JWT_EXPIRES_IN` | Thời hạn JWT | `7d` |

### Frontend (`client/.env`)

| Biến | Mô tả | Giá trị mặc định |
|---|---|---|
| `VITE_API_URL` | URL gốc của Backend API | `http://localhost:5000/api` |

---

## 📡 API Reference

Tất cả API yêu cầu header xác thực (trừ `/api/auth/login`):
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập |

### Sản phẩm & Danh mục
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/products` | Danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm) |
| `POST` | `/api/products` | Tạo sản phẩm mới |
| `PUT` | `/api/products/:id` | Cập nhật sản phẩm |
| `DELETE` | `/api/products/:id` | Xóa sản phẩm |
| `GET` | `/api/categories` | Danh sách nhóm hàng |

### Kho, Xưởng & Vị trí
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/warehouses` | Danh sách kho |
| `GET` | `/api/workshops` | Danh sách xưởng |
| `GET` | `/api/locations` | Danh sách vị trí trong kho |

### Tồn kho
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/inventory` | Tồn kho (kèm `avg_unit_price`, `total_value`) |
| `GET` | `/api/inventory/value` | Tổng giá trị tồn kho toàn hệ thống (nhóm theo kho) |

### Nhập / Xuất kho
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/imports` | Danh sách phiếu nhập (phân trang, lọc) |
| `POST` | `/api/imports` | Tạo phiếu nhập kho |
| `GET` | `/api/imports/:id` | Chi tiết phiếu nhập |
| `GET` | `/api/exports` | Danh sách phiếu xuất |
| `POST` | `/api/exports` | Tạo phiếu xuất kho |
| `GET` | `/api/exports/:id` | Chi tiết phiếu xuất |

### Lịch sử & Báo cáo
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/stock-history` | Lịch sử biến động tồn kho |
| `GET` | `/api/dashboard/summary` | Tổng quan dashboard |
| `GET` | `/api/reports/...` | Xuất báo cáo Excel |

### Kiểm kê & Hàng lỗi
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET/POST` | `/api/inventory-checks` | Quản lý phiếu kiểm kê |
| `GET/POST` | `/api/defective-items` | Quản lý hàng lỗi |

---

## 🗄️ Database Schema

Các bảng chính trong hệ thống:

```
users               — Tài khoản & vai trò người dùng
categories          — Nhóm hàng hóa
suppliers           — Nhà cung cấp
warehouses          — Kho hàng
workshops           — Xưởng sản xuất
products            — Sản phẩm / linh kiện
locations           — Vị trí trong kho

import_receipts     — Phiếu nhập kho
import_details      — Chi tiết từng dòng của phiếu nhập

export_receipts     — Phiếu xuất kho
export_details      — Chi tiết từng dòng của phiếu xuất

inventory           — Tồn kho hiện tại (quantity, avg_unit_price ← WAC)
stock_history       — Lịch sử biến động (unit_cost, total_value)

inventory_checks    — Phiếu kiểm kê
inventory_check_details — Chi tiết kiểm kê
defective_items     — Hàng lỗi / hư hỏng
scrap_receipts      — Phiếu hủy hàng
```

### Mô hình định giá WAC

Mỗi khi nhập hàng từ NCC, hệ thống tự động tính lại `avg_unit_price` theo công thức:

```
avg_unit_price_mới = (tồn_cũ × avg_unit_price_cũ + số_lượng_nhập × đơn_giá_nhập)
                     ÷ (tồn_cũ + số_lượng_nhập)
```

---

## 🔧 Scripts tiện ích

### Backfill đơn giá bình quân (chạy 1 lần)

Nếu hệ thống đã có dữ liệu nhập kho từ trước nhưng chưa có `avg_unit_price`, chạy script sau để tính toán hồi tố từ lịch sử nhập:

```bash
# Chạy từ thư mục umc-warehouse/
node server/scripts/backfillAvgPrice.js
```

Script sẽ:
- Tính WAC lũy kế theo thứ tự thời gian cho từng cặp `(product_id, warehouse_id)`
- Chỉ sử dụng giá từ phiếu nhập loại **Từ NCC** (bỏ qua giá nhập xưởng)
- Liệt kê các sản phẩm không có giá NCC cần nhập thủ công
- Bọc toàn bộ trong **1 transaction** — rollback tự động nếu lỗi

### Seed dữ liệu mẫu

```bash
node server/scripts/demoSeed.js
```

---

## 🌐 Deploy

### Backend — Render

1. Tạo Web Service mới trên [render.com](https://render.com)
2. Root Directory: `umc-warehouse/server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Cấu hình Environment Variables theo bảng [Biến môi trường](#-biến-môi-trường) ở trên
6. Kết nối MySQL qua Render Managed Database hoặc PlanetScale

### Frontend — Vercel

1. Import repository trên [vercel.com](https://vercel.com)
2. Root Directory: `umc-warehouse/client`
3. Framework Preset: **Vite**
4. Thêm Environment Variable: `VITE_API_URL=https://<your-backend>.onrender.com/api`
5. File `vercel.json` đã được cấu hình sẵn để xử lý SPA routing (tránh lỗi 404 khi F5)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 📝 License

Dự án được phát triển phục vụ mục đích học thuật — Đồ án thực tập kỹ thuật.

---

<p align="center">Made with ❤️ by the UMC Warehouse Team</p>
