# VERSIONS.md — UMC Warehouse Management System

Tài liệu ghi lại version chính xác của toàn bộ dependencies trong dự án.
Dùng để tham chiếu khi viết **Chương 4 — Công nghệ và Công cụ sử dụng**.

---

## Server (`umc-warehouse/server/`)

**Runtime:** Node.js v22.14.0

### Dependencies (Production)

| Package | Version | Mô tả |
|---------|---------|-------|
| `express` | **4.21.2** | Web framework cho Node.js |
| `sequelize` | **6.37.8** | ORM hỗ trợ MySQL, PostgreSQL, SQLite |
| `mysql2` | **3.11.5** | MySQL driver cho Node.js (dùng với Sequelize) |
| `jsonwebtoken` | **9.0.2** | Tạo và xác thực JWT token |
| `bcryptjs` | **2.4.3** | Hash mật khẩu bằng bcrypt (pure JS) |
| `dotenv` | **16.4.7** | Load biến môi trường từ file `.env` |
| `cors` | **2.8.5** | Middleware xử lý Cross-Origin Resource Sharing |
| `morgan` | **1.10.0** | HTTP request logger middleware |

### DevDependencies

| Package | Version | Mô tả |
|---------|---------|-------|
| `nodemon` | **3.1.9** | Auto-restart server khi file thay đổi |
| `sequelize-cli` | **6.6.2** | CLI tool để tạo migrations và seeders |
| `eslint` | 10.6.0 | Linting JavaScript |
| `prettier` | 3.9.4 | Code formatter |

### Scripts

```json
"dev":   "nodemon server.js"
"start": "node server.js"
"lint":  "eslint src --ext .js server.js"
```

---

## Client (`umc-warehouse/client/`)

**Build tool:** Vite 6.0.5

### Dependencies (Production)

| Package | Version | Mô tả |
|---------|---------|-------|
| `react` | **18.3.1** | Thư viện UI chính |
| `react-dom` | **18.3.1** | React DOM renderer |
| `react-router-dom` | **6.28.1** | Client-side routing (v6) |
| `@tanstack/react-query` | **5.62.10** | Data fetching, caching và state management |
| `axios` | **1.7.9** | HTTP client với interceptor support |
| `antd` | **5.22.5** | Ant Design — UI component library |
| `dayjs` | **1.11.13** | Thư viện xử lý ngày tháng (nhẹ hơn moment.js) |
| `recharts` | **2.15.0** | Thư viện vẽ biểu đồ dựa trên D3 |

### DevDependencies

| Package | Version | Mô tả |
|---------|---------|-------|
| `vite` | **6.0.5** | Build tool và dev server |
| `@vitejs/plugin-react` | **4.3.4** | Plugin hỗ trợ React JSX và Fast Refresh |
| `eslint` | 9.39.4 | Linting JavaScript/JSX |
| `prettier` | 3.9.4 | Code formatter |

### Scripts

```json
"dev":      "vite"
"build":    "vite build"
"preview":  "vite preview"
"lint":     "eslint src --ext .js,.jsx"
"lint:fix": "eslint src --ext .js,.jsx --fix"
"format":   "prettier --write src/**/*.{js,jsx}"
```

---

## Ghi chú cho Báo cáo Chương 4

### ⚠️ Peer Dependency Warnings (không ảnh hưởng runtime)

- `recharts@2.15.0` — phiên bản này bị deprecated, tuy nhiên vẫn hoạt động bình thường với React 18. Recharts v3 yêu cầu breaking changes về API.
- `@types/react@19`, `@types/react-dom@19` — các type declarations vẫn tương thích với React 18.

### Sequelize CLI

`sequelize-cli init` đã tạo cấu trúc:
```
server/
├── config/config.json   (cấu hình kết nối DB theo environment)
├── models/              (index.js auto-load tất cả models)
├── migrations/          (lịch sử thay đổi schema)
└── seeders/             (dữ liệu khởi tạo)
```

---

*Được tạo tự động — cập nhật lần cuối: 2026-07-05*
