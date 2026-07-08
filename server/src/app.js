const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const productRoutes = require('./routes/productRoutes');
const locationRoutes = require('./routes/locationRoutes');
const importRoutes = require('./routes/importRoutes');
const exportRoutes = require('./routes/exportRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryCheckRoutes = require('./routes/inventoryCheckRoutes');
const defectiveRoutes = require('./routes/defectiveRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const stockHistoryRoutes = require('./routes/stockHistoryRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-checks', inventoryCheckRoutes);
app.use('/api/defective-items', defectiveRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock-history', stockHistoryRoutes);

// Error handler (phải đặt cuối cùng)
app.use(errorHandler);

module.exports = app;
