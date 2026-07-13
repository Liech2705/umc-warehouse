import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, message, Card, Alert, Space } from 'antd';
import { PlusOutlined, BankOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function WarehouseList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  const warehouses = response?.data || [];

  // 2. Create
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/warehouses', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo kho "${res.data?.warehouse_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 3. Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/warehouses/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật kho "${res.data?.warehouse_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 4. Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/warehouses/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa kho thành công');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể xóa kho hàng này');
    },
  });

  const handleOpenAddModal = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingWarehouse(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    if (editingWarehouse) {
      updateMutation.mutate({
        id: editingWarehouse.warehouse_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Mã kho',
      dataIndex: 'warehouse_id',
      key: 'warehouse_id',
      width: 120,
    },
    {
      title: 'Tên kho hàng',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      sorter: (a, b) => a.warehouse_name.localeCompare(b.warehouse_name),
    },
    {
      title: 'Địa điểm / Vị trí',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.warehouse_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa kho hàng này?"
          deleteDescription="Chỉ được xóa khi kho không có sản phẩm tồn kho hay phiếu nhập/xuất liên quan."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh sách Kho Hàng"
        subtitle="Quản lý hệ thống các kho vật tư, thành phẩm và bán thành phẩm"
        icon={<BankOutlined />}
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
            description="Không thể tải danh sách kho hàng. Vui lòng thử lại."
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
          dataSource={warehouses}
          columns={columns}
          rowKey="warehouse_id"
          loading={isLoading}
          emptyTitle="Chưa có kho hàng nào"
          emptyDescription="Thêm kho hàng đầu tiên để bắt đầu quản lý tồn kho."
          emptyActionText={canModify ? 'Thêm kho hàng' : undefined}
          onEmptyAction={canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingWarehouse ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingWarehouse ? 'Cập nhật kho hàng' : 'Tạo kho mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingWarehouse ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="warehouse_name"
            label="Tên kho hàng"
            rules={[{ required: true, message: 'Tên kho không được để trống!' }]}
          >
            <Input placeholder="Nhập tên kho hàng (VD: Kho NVL, Kho thành phẩm...)" />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm / Vị trí">
            <Input placeholder="Nhập vị trí cụ thể" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
