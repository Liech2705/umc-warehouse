import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, Space, message, Card, Select, Alert } from 'antd';
import { PlusOutlined, EnvironmentOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function LocationList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // State quản lý Modal & Filter
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(undefined);

  // Phân quyền trên UI
  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch danh sách kho hàng (để dùng cho bộ lọc & Select trong modal)
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });
  const warehouses = warehousesResponse?.data || [];

  // 2. Fetch danh sách vị trí lưu trữ (tự động refetch khi selectedWarehouseId thay đổi)
  const {
    data: locationsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      const params = selectedWarehouseId ? { warehouse_id: selectedWarehouseId } : {};
      const { data } = await axiosClient.get('/locations', { params });
      return data;
    },
  });
  const locations = locationsResponse?.data || [];

  // 3. Mutation tạo mới vị trí
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/locations', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo vị trí "${res.data?.location_code || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      handleCloseModal();
    },
    onError: (err) => {
      const backendMessage = err.response?.data?.message;
      if (err.response?.status === 400 && backendMessage && backendMessage.includes('đã tồn tại')) {
        form.setFields([
          {
            name: 'location_code',
            errors: ['Mã vị trí này đã tồn tại trong kho đã chọn'],
          },
        ]);
      } else {
        message.error(backendMessage || 'Có lỗi xảy ra khi tạo mới');
      }
    },
  });

  // 4. Mutation cập nhật vị trí
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/locations/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật vị trí "${res.data?.location_code || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      handleCloseModal();
    },
    onError: (err) => {
      const backendMessage = err.response?.data?.message;
      if (err.response?.status === 400 && backendMessage && backendMessage.includes('đã tồn tại')) {
        form.setFields([
          {
            name: 'location_code',
            errors: ['Mã vị trí này đã tồn tại trong kho đã chọn'],
          },
        ]);
      } else {
        message.error(backendMessage || 'Có lỗi xảy ra khi cập nhật');
      }
    },
  });

  // 5. Mutation xóa vị trí
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/locations/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa vị trí thành công');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa vị trí');
    },
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingLocation(null);
    form.resetFields();
    // Nếu đang chọn filter kho nào thì prefill kho đó vào modal luôn cho tiện UX
    if (selectedWarehouseId) {
      form.setFieldsValue({ warehouse_id: selectedWarehouseId });
    }
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (record) => {
    setEditingLocation(record);
    form.setFieldsValue({
      warehouse_id: record.warehouse_id,
      location_code: record.location_code,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    form.resetFields();
  };

  // Gửi form
  const handleFormSubmit = (values) => {
    if (editingLocation) {
      updateMutation.mutate({
        id: editingLocation.location_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Mã vị trí',
      dataIndex: 'location_code',
      key: 'location_code',
      sorter: (a, b) => a.location_code.localeCompare(b.location_code),
    },
    {
      title: 'Tên kho hàng',
      dataIndex: ['Warehouse', 'warehouse_name'],
      key: 'warehouse_name',
      sorter: (a, b) => {
        const nameA = a.Warehouse?.warehouse_name || '';
        const nameB = b.Warehouse?.warehouse_name || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.location_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa vị trí này?"
          deleteDescription="Chỉ xóa được khi không có sản phẩm tồn kho nào ở vị trí này."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý Vị Trí Lưu Trữ"
        subtitle="Chi tiết định vị các kệ, tầng, ô lưu trữ trong từng kho"
        icon={<EnvironmentOutlined />}
        extra={
          <Space size="middle">
            <Select
              showSearch
              placeholder="Lọc theo kho hàng"
              optionFilterProp="label"
              style={{ width: 220 }}
              allowClear
              value={selectedWarehouseId}
              onChange={(value) => setSelectedWarehouseId(value)}
              options={warehouses.map((w) => ({ label: w.warehouse_name, value: w.warehouse_id }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!canModify}
              onClick={handleOpenAddModal}
            >
              Thêm mới
            </Button>
          </Space>
        }
      />
      <Card bordered={false}>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải danh sách vị trí lưu trữ. Vui lòng thử lại."
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
          dataSource={locations}
          columns={columns}
          rowKey="location_id"
          loading={isLoading}
          emptyTitle="Chưa có vị trí lưu trữ nào"
          emptyDescription={
            selectedWarehouseId
              ? 'Kho này chưa có vị trí nào. Thêm vị trí đầu tiên.'
              : 'Chọn kho hoặc thêm vị trí mới.'
          }
          emptyActionText={canModify ? 'Thêm vị trí' : undefined}
          onEmptyAction={canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingLocation ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingLocation ? 'Cập nhật vị trí kho' : 'Tạo vị trí kho mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingLocation ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="warehouse_id"
            label="Chọn kho hàng"
            rules={[{ required: true, message: 'Vui lòng chọn kho hàng!' }]}
          >
            <Select
              showSearch
              placeholder="Chọn kho hàng chứa vị trí này"
              optionFilterProp="label"
              options={warehouses.map((w) => ({
                label: w.warehouse_name,
                value: w.warehouse_id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="location_code"
            label="Mã vị trí"
            rules={[
              { required: true, message: 'Mã vị trí không được để trống!' },
              { max: 50, message: 'Mã vị trí tối đa 50 ký tự!' },
            ]}
          >
            <Input placeholder="Nhập mã vị trí (VD: A1-01, B2-05...)" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ max: 255, message: 'Mô tả tối đa 255 ký tự!' }]}
          >
            <Input.TextArea placeholder="Nhập mô tả vị trí (không bắt buộc)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
