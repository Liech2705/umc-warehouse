import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, message, Card, Alert, Space } from 'antd';
import { PlusOutlined, BuildOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function WorkshopList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);

  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['workshops'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/workshops');
      return data;
    },
  });

  const workshops = response?.data || [];

  // 2. Create
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/workshops', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo xưởng "${res.data?.workshop_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 3. Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/workshops/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật xưởng "${res.data?.workshop_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 4. Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/workshops/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa xưởng thành công');
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể xóa xưởng sản xuất này');
    },
  });

  const handleOpenAddModal = () => {
    setEditingWorkshop(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingWorkshop(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkshop(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    if (editingWorkshop) {
      updateMutation.mutate({
        id: editingWorkshop.workshop_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Mã xưởng',
      dataIndex: 'workshop_id',
      key: 'workshop_id',
      width: 120,
    },
    {
      title: 'Tên xưởng sản xuất',
      dataIndex: 'workshop_name',
      key: 'workshop_name',
      sorter: (a, b) => a.workshop_name.localeCompare(b.workshop_name),
    },
    {
      title: 'Quản lý xưởng',
      dataIndex: 'manager_name',
      key: 'manager_name',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.workshop_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa xưởng này?"
          deleteDescription="Chỉ được xóa khi chưa có phiếu nhập/xuất liên quan."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh sách Xưởng Sản Xuất"
        subtitle="Quản lý thông tin các phân xưởng sản xuất nhận vật tư và trả thành phẩm"
        icon={<BuildOutlined />}
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
            description="Không thể tải danh sách xưởng sản xuất. Vui lòng thử lại."
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
          dataSource={workshops}
          columns={columns}
          rowKey="workshop_id"
          loading={isLoading}
          emptyTitle="Chưa có xưởng sản xuất nào"
          emptyDescription="Thêm xưởng đầu tiên để bắt đầu quản lý xuất kho nội bộ."
          emptyActionText={canModify ? 'Thêm xưởng' : undefined}
          onEmptyAction={canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingWorkshop ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingWorkshop ? 'Cập nhật xưởng sản xuất' : 'Tạo xưởng mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingWorkshop ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="workshop_name"
            label="Tên xưởng sản xuất"
            rules={[{ required: true, message: 'Tên xưởng không được để trống!' }]}
          >
            <Input placeholder="Nhập tên xưởng (VD: Xưởng SMT, Lắp ráp...)" />
          </Form.Item>
          <Form.Item name="manager_name" label="Quản lý xưởng">
            <Input placeholder="Nhập tên người quản lý xưởng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
