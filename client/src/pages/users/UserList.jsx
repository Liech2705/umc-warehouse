import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Card,
  message,
  Alert,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusTag from '../../components/common/StatusTag';

export default function UserList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users list
  const {
    data: usersRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/users');
      return data;
    },
  });

  const users = usersRes?.data || [];

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (values) => {
      const { data } = await axiosClient.post('/users', values);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Tạo tài khoản thành công.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể tạo tài khoản.');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const { data } = await axiosClient.put(`/users/${id}`, values);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Cập nhật tài khoản thành công.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      editForm.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể cập nhật tài khoản.');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }) => {
      const { data } = await axiosClient.put(`/users/${id}/reset-password`, { password });
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Đã đặt lại mật khẩu.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsResetModalOpen(false);
      setSelectedUser(null);
      resetForm.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi đặt lại mật khẩu.');
    },
  });

  // Toggle lock/unlock (using delete endpoint to lock, and put endpoint to unlock)
  const lockMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/users/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Đã khóa tài khoản.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi khóa tài khoản.');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.put(`/users/${id}`, { status: 1 });
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Đã kích hoạt lại tài khoản.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi kích hoạt lại tài khoản.');
    },
  });

  const handleOpenCreateModal = () => {
    createForm.resetFields();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setSelectedUser(record);
    editForm.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
      status: record.status,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenResetModal = (record) => {
    setSelectedUser(record);
    resetForm.resetFields();
    setIsResetModalOpen(true);
  };

  const isCurrentUser = (record) => {
    return user && record.user_id === user.user_id;
  };

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <StatusTag
          status={role}
          statusMap={{
            Admin: { label: 'Quản trị viên', color: '#D64545' },
            QuanLy: { label: 'Quản lý', color: '#1E3A5F' },
            ThuKho: { label: 'Thủ kho', color: '#2A9D6F' },
            NhanVien: { label: 'Nhân viên', color: '#E9A23B' },
          }}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <StatusTag
          status={status}
          statusMap={{
            1: { label: 'Hoạt động', color: '#2A9D6F' },
            0: { label: 'Đã khóa', color: '#D64545' },
          }}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 250,
      align: 'center',
      render: (_, record) => {
        const isSelf = isCurrentUser(record);
        return (
          <Space size="small">
            <Tooltip title={isSelf ? 'Không thể chỉnh sửa chính mình' : 'Chỉnh sửa tài khoản'}>
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={isSelf}
                onClick={() => handleOpenEditModal(record)}
              />
            </Tooltip>
            <Tooltip title={isSelf ? 'Không thể đổi mật khẩu của mình ở đây' : 'Đặt lại mật khẩu'}>
              <Button
                type="text"
                icon={<KeyOutlined />}
                disabled={isSelf}
                onClick={() => handleOpenResetModal(record)}
              />
            </Tooltip>
            {record.status === 1 ? (
              <Popconfirm
                title="Khóa tài khoản này?"
                description="Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống."
                onConfirm={() => lockMutation.mutate(record.user_id)}
                okText="Khóa"
                cancelText="Hủy"
                disabled={isSelf}
              >
                <Tooltip title={isSelf ? 'Không thể tự khóa chính mình' : 'Khóa tài khoản'}>
                  <Button type="text" danger icon={<LockOutlined />} disabled={isSelf} />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="Kích hoạt lại tài khoản?"
                description="Cho phép tài khoản này đăng nhập lại vào hệ thống."
                onConfirm={() => unlockMutation.mutate(record.user_id)}
                okText="Mở khóa"
                cancelText="Hủy"
                disabled={isSelf}
              >
                <Tooltip title={isSelf ? 'Không thể tự mở khóa chính mình' : 'Kích hoạt tài khoản'}>
                  <Button
                    type="text"
                    style={{ color: '#2A9D6F' }}
                    icon={<UnlockOutlined />}
                    disabled={isSelf}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý Người Dùng"
        subtitle="Quản lý thông tin tài khoản, phân quyền vài trò của nhân viên hệ thống"
        icon={<TeamOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            Thêm tài khoản
          </Button>
        }
      />

      <Card bordered={false}>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải danh sách tài khoản người dùng. Vui lòng thử lại."
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={() => refetch()}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <DataTable dataSource={users} columns={columns} rowKey="user_id" loading={isLoading} />
      </Card>

      {/* Modal Thêm tài khoản */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            <span>Thêm tài khoản mới</span>
          </Space>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              {
                pattern: /^[a-zA-Z0-9_]{4,20}$/,
                message: 'Tên đăng nhập từ 4-20 ký tự chữ và số, không khoảng trắng.',
              },
            ]}
          >
            <Input placeholder="Nhập tên đăng nhập (ví dụ: nguyenvanan)" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên.' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu ban đầu" />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Nhập họ và tên đầy đủ" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              options={[
                { label: 'Quản trị viên (Admin)', value: 'Admin' },
                { label: 'Quản lý (QuanLy)', value: 'QuanLy' },
                { label: 'Thủ kho (ThuKho)', value: 'ThuKho' },
                { label: 'Nhân viên (NhanVien)', value: 'NhanVien' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chỉnh sửa thông tin */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            <span>Chỉnh sửa tài khoản</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate({ id: selectedUser.user_id, values })}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Nhập họ và tên đầy đủ" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              options={[
                { label: 'Quản trị viên (Admin)', value: 'Admin' },
                { label: 'Quản lý (QuanLy)', value: 'QuanLy' },
                { label: 'Thủ kho (ThuKho)', value: 'ThuKho' },
                { label: 'Nhân viên (NhanVien)', value: 'NhanVien' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái tài khoản"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select
              options={[
                { label: 'Hoạt động', value: 1 },
                { label: 'Đã khóa', value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Đặt lại mật khẩu */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: 'var(--clr-warning-500)' }} />
            <span>Đặt lại mật khẩu</span>
          </Space>
        }
        open={isResetModalOpen}
        onCancel={() => {
          setIsResetModalOpen(false);
          setSelectedUser(null);
        }}
        onOk={() => resetForm.submit()}
        confirmLoading={resetPasswordMutation.isPending}
        okText="Cập nhật mật khẩu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={resetForm}
          layout="vertical"
          onFinish={(values) =>
            resetPasswordMutation.mutate({ id: selectedUser.user_id, password: values.password })
          }
          style={{ marginTop: 16 }}
        >
          <div style={{ marginBottom: 16 }}>
            Đặt lại mật khẩu cho tài khoản: <strong>{selectedUser?.username}</strong>
          </div>
          <Form.Item
            name="password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên.' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
