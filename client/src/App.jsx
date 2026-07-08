import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { message } from 'antd';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import CategoryList from './pages/categories/CategoryList';
import ProductList from './pages/products/ProductList';
import SupplierList from './pages/suppliers/SupplierList';
import WarehouseList from './pages/warehouses/WarehouseList';
import LocationList from './pages/locations/LocationList';
import WorkshopList from './pages/workshops/WorkshopList';
import ImportList from './pages/imports/ImportList';
import ImportCreate from './pages/imports/ImportCreate';
import ExportList from './pages/exports/ExportList';
import ExportCreate from './pages/exports/ExportCreate';
import InventoryList from './pages/inventory/InventoryList';
import InventoryCheckDetail from './pages/inventory-checks/InventoryCheckDetail';
import DefectiveItemList from './pages/defective-items/DefectiveItemList';
import UserList from './pages/users/UserList';
import StockHistoryList from './pages/stock-history/StockHistoryList';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './contexts/AuthContext';

function AdminRoute({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      message.error('Bạn không có quyền truy cập trang này');
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ManagementRoute({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'Admin' && user.role !== 'QuanLy') {
      message.error('Bạn không có quyền truy cập trang này');
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin' && user.role !== 'QuanLy') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/warehouses" element={<WarehouseList />} />
          <Route path="/locations" element={<LocationList />} />
          <Route path="/workshops" element={<WorkshopList />} />
          <Route path="/imports" element={<ImportList />} />
          <Route path="/imports/create" element={<ImportCreate />} />
          <Route path="/exports" element={<ExportList />} />
          <Route path="/exports/create" element={<ExportCreate />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory-checks" element={<InventoryCheckDetail />} />
          <Route path="/defective-items" element={<DefectiveItemList />} />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UserList />
              </AdminRoute>
            }
          />
          <Route
            path="/stock-history"
            element={
              <ManagementRoute>
                <StockHistoryList />
              </ManagementRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
