import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, Space, Popconfirm, message, Card, Alert } from 'antd';
import { PlusOutlined, ShopOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function SupplierList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch danh sách
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/suppliers');
      return data;
    },
  });

  const suppliers = response?.data || [];

  // 2. Create
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/suppliers', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo nhà cung cấp "${res.data?.supplier_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 3. Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/suppliers/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật nhà cung cấp "${res.data?.supplier_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 4. Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/suppliers/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa nhà cung cấp thành công');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể xóa nhà cung cấp này');
    },
  });

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier.supplier_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Tên nhà cung cấp',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      sorter: (a, b) => a.supplier_name.localeCompare(b.supplier_name),
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contact_person',
      key: 'contact_person',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.supplier_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa nhà cung cấp này?"
          deleteDescription="Chỉ được xóa khi chưa có phiếu nhập hàng liên quan."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh sách Nhà Cung Cấp"
        subtitle="Quản lý thông tin liên hệ và đối tác cung ứng vật tư thiết bị"
        icon={<ShopOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!canModify}
            onClick={handleOpenAddModal}
          >
            Thêm mới
          </Button>
        }
      />
      <Card bordered={false}>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải danh sách nhà cung cấp. Vui lòng thử lại."
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
        <DataTable
          dataSource={suppliers}
          columns={columns}
          rowKey="supplier_id"
          loading={isLoading}
          emptyTitle="Chưa có nhà cung cấp nào"
          emptyDescription="Thêm nhà cung cấp đầu tiên để bắt đầu quản lý đầu vào."
          emptyActionText={canModify ? 'Thêm nhà cung cấp' : undefined}
          onEmptyAction={canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingSupplier ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingSupplier ? 'Cập nhật nhà cung cấp' : 'Tạo nhà cung cấp mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingSupplier ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="supplier_name"
            label="Tên nhà cung cấp"
            rules={[{ required: true, message: 'Tên nhà cung cấp không được để trống!' }]}
          >
            <Input placeholder="Nhập tên nhà cung cấp" />
          </Form.Item>
          <Form.Item name="contact_person" label="Người liên hệ">
            <Input placeholder="Nhập tên người liên hệ" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
