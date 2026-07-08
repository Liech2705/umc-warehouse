import { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Breadcrumb,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Tooltip,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  ShopOutlined,
  BankOutlined,
  EnvironmentOutlined,
  BuildOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
  AuditOutlined,
  WarningOutlined,
  TeamOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  HistoryOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axiosClient from '../api/axiosClient';

const { Header, Sider, Content } = Layout;

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/categories': 'Nhóm hàng',
  '/products': 'Sản phẩm',
  '/suppliers': 'Nhà cung cấp',
  '/warehouses': 'Kho hàng',
  '/locations': 'Vị trí kho',
  '/workshops': 'Xưởng sản xuất',
  '/imports': 'Nhập kho',
  '/imports/create': 'Tạo phiếu nhập',
  '/exports': 'Xuất kho',
  '/exports/create': 'Tạo phiếu xuất',
  '/inventory': 'Tồn kho',
  '/inventory-checks': 'Kiểm kê',
  '/defective-items': 'Hàng lỗi / Hủy',
  '/users': 'Quản lý người dùng',
  '/stock-history': 'Lịch sử thao tác',
};

const ROUTE_PARENTS = {
  '/categories': 'Sản phẩm',
  '/products': 'Sản phẩm',
  '/warehouses': 'Kho & Xưởng',
  '/locations': 'Kho & Xưởng',
  '/workshops': 'Kho & Xưởng',
  '/imports/create': 'Nhập kho',
  '/exports/create': 'Xuất kho',
};

function buildBreadcrumbs(pathname) {
  const items = [{ title: 'Home' }];
  const parent = ROUTE_PARENTS[pathname];
  if (parent) items.push({ title: parent });
  const label = ROUTE_LABELS[pathname];
  if (label && label !== 'Home') items.push({ title: label });
  return items;
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1]?.[0]?.toUpperCase() || 'U';
}

const ROLE_STYLES = {
  Admin:    { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1.5px solid rgba(239, 68, 68, 0.3)', label: 'ADMIN' },
  QuanLy:   { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: '1.5px solid rgba(59, 130, 246, 0.3)', label: 'QUẢN LÝ' },
  ThuKho:   { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1.5px solid rgba(16, 185, 129, 0.3)', label: 'THỦ KHO' },
  NhanVien: { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1.5px solid rgba(245, 158, 11, 0.3)', label: 'NHÂN VIÊN' },
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [changePasswordForm] = Form.useForm();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (values) => {
      const res = await axiosClient.put('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      return res.data;
    },
    onSuccess: (data) => {
      message.success(data.message || 'Đổi mật khẩu thành công.');
      setIsChangePasswordOpen(false);
      changePasswordForm.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi đổi mật khẩu.');
    },
  });

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 1200);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuClick = ({ key }) => navigate(key);

  const getMenuItems = () => {
    const items = [
      { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
      {
        key: 'product-menu',
        icon: <AppstoreOutlined />,
        label: 'Sản phẩm',
        children: [
          { key: '/categories', icon: <AppstoreOutlined />, label: 'Nhóm hàng' },
          { key: '/products', icon: <BarcodeOutlined />, label: 'Sản phẩm' },
        ],
      },
      { key: '/suppliers', icon: <ShopOutlined />, label: 'Nhà cung cấp' },
      {
        key: 'warehouse-menu',
        icon: <BankOutlined />,
        label: 'Kho & Xưởng',
        children: [
          { key: '/warehouses', icon: <BankOutlined />, label: 'Kho hàng' },
          { key: '/locations', icon: <EnvironmentOutlined />, label: 'Vị trí kho' },
          { key: '/workshops', icon: <BuildOutlined />, label: 'Xưởng sản xuất' },
        ],
      },
      { key: '/imports', icon: <ImportOutlined />, label: 'Nhập kho' },
      { key: '/exports', icon: <ExportOutlined />, label: 'Xuất kho' },
      { key: '/inventory', icon: <DatabaseOutlined />, label: 'Tồn kho' },
      { key: '/inventory-checks', icon: <AuditOutlined />, label: 'Kiểm kê' },
      { key: '/defective-items', icon: <WarningOutlined />, label: 'Hàng lỗi / Hủy' },
    ];
    if (user?.role === 'Admin') {
      items.push({ key: '/users', icon: <TeamOutlined />, label: 'Quản lý người dùng' });
    }
    if (user?.role === 'Admin' || user?.role === 'QuanLy') {
      items.push({ key: '/stock-history', icon: <HistoryOutlined />, label: 'Lịch sử thao tác' });
    }
    return items;
  };

  const getOpenKeys = () => {
    if (
      location.pathname.startsWith('/categories') ||
      location.pathname.startsWith('/products')
    )
      return ['product-menu'];
    if (
      location.pathname.startsWith('/warehouses') ||
      location.pathname.startsWith('/locations') ||
      location.pathname.startsWith('/workshops')
    )
      return ['warehouse-menu'];
    return [];
  };

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.NhanVien;

  const userMenuItems = [
    {
      key: 'info',
      icon: <InfoCircleOutlined />,
      label: 'Thông tin tài khoản',
      onClick: () => {
        Modal.info({
          title: 'Thông tin tài khoản',
          content: (
            <div style={{ paddingTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Tên đăng nhập', value: user?.username },
                  { label: 'Họ và tên', value: user?.full_name },
                  { label: 'Vai trò', value: user?.role },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13, minWidth: 110 }}>{label}:</span>
                    <strong style={{ fontSize: 13 }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ),
          okText: 'Đóng',
          icon: null,
        });
      },
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => setIsChangePasswordOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--surface-bg)' }}>
      {/* ══════════════ SIDEBAR ══════════════ */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={230}
        style={{
          background: 'var(--gradient-sidebar)',
          boxShadow: 'var(--shadow-sidebar)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Branding Area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/')}
        >
          {/* Logo SVG */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #E30613, #FF4D4D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(227,6,19,0.4)',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18}>
              <circle cx="12" cy="6" r="3.5" fill="#FFFFFF" />
              <path d="M 3,17 C 7,10 10.5,10 12,12.5 C 13.5,10 17,10 21,17 C 16.5,14 7.5,14 3,17 Z" fill="#FFFFFF" />
            </svg>
          </div>

          {!collapsed && (
            <div style={{ animation: 'fadeIn 200ms ease' }}>
              <div
                style={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 15,
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                }}
              >
                UMC WMS
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  lineHeight: 1.2,
                  letterSpacing: '0.03em',
                }}
              >
                Warehouse Management
              </div>
            </div>
          )}
        </div>

        {/* Nav Menu */}
        <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingTop: 8 }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={getOpenKeys()}
            items={getMenuItems()}
            onClick={handleMenuClick}
            inlineIndent={16}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 13,
            }}
          />
        </div>

        {/* Bottom: mini user card */}
        {!collapsed && (
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeIn 200ms ease',
            }}
          >
            <Avatar
              style={{
                background: 'linear-gradient(135deg, #E8871E, #F59E0B)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
              size={32}
            >
              {getInitials(user?.full_name)}
            </Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 12,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.full_name || 'Người dùng'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{user?.role}</div>
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        {/* ══════════════ HEADER ══════════════ */}
        <Header
          style={{
            padding: '0 20px',
            background: 'var(--surface-header)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 60,
            borderBottom: '1px solid var(--border-default)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-header)',
          }}
        >
          {/* Left: Toggle + Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 8,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                fontSize: 16,
                transition: 'all 150ms ease',
              }}
              onClick={() => setCollapsed(!collapsed)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <Breadcrumb items={buildBreadcrumbs(location.pathname)} />
          </div>

          {/* Right: Dark mode + Role tag + Avatar dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Dark Mode Toggle */}
            <Tooltip title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}>
              <button
                style={{
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 15,
                  transition: 'all 150ms ease',
                }}
                onClick={toggleTheme}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--clr-primary-400)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                aria-label="Toggle dark mode"
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                role="button"
                tabIndex={0}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 10, transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
              >
                {user && (
                  <span
                    style={{
                      background: roleStyle.bg,
                      color: roleStyle.color,
                      border: roleStyle.border,
                      fontWeight: 600,
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      lineHeight: '12px',
                      height: '18px',
                    }}
                  >
                    {roleStyle.label}
                  </span>
                )}
                <Avatar
                  style={{
                    background: 'linear-gradient(135deg, #E8871E, #F59E0B)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 0 0 2px rgba(245,158,11,0.3)',
                  }}
                  size={32}
                >
                  {getInitials(user?.full_name)}
                </Avatar>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.full_name || 'Người dùng'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* ══════════════ CONTENT ══════════════ */}
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: 'var(--surface-bg)',
            minHeight: 'calc(100vh - 60px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* ══════════════ CHANGE PASSWORD MODAL ══════════════ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 15,
              }}
            >
              <KeyOutlined />
            </span>
            <span>Đổi mật khẩu tài khoản</span>
          </div>
        }
        open={isChangePasswordOpen}
        onCancel={() => {
          setIsChangePasswordOpen(false);
          changePasswordForm.resetFields();
        }}
        onOk={() => changePasswordForm.submit()}
        confirmLoading={changePasswordMutation.isPending}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnClose
        width={440}
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={(values) => changePasswordMutation.mutate(values)}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="oldPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu mới nhập lại không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
