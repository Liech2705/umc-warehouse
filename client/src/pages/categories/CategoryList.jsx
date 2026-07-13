import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, message, Card, Alert, Space } from 'antd';
import { PlusOutlined, AppstoreOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function CategoryList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Phân quyền trên UI
  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch danh sách nhóm hàng
  const {
    data: categoriesResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/categories');
      return data;
    },
  });

  const categories = categoriesResponse?.data || [];

  // 2. Mutation tạo mới nhóm hàng
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/categories', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo nhóm hàng "${res.data?.category_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo mới');
    },
  });

  // 3. Mutation cập nhật nhóm hàng
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/categories/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật nhóm hàng "${res.data?.category_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    },
  });

  // 4. Mutation xóa nhóm hàng
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/categories/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa nhóm hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể xóa nhóm hàng này');
    },
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({ category_name: record.category_name });
    setIsModalOpen(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  // Gửi form
  const handleFormSubmit = (values) => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.category_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Mã nhóm',
      dataIndex: 'category_id',
      key: 'category_id',
      width: 100,
      sorter: (a, b) => a.category_id - b.category_id,
    },
    {
      title: 'Tên nhóm hàng',
      dataIndex: 'category_name',
      key: 'category_name',
      sorter: (a, b) => a.category_name.localeCompare(b.category_name),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.category_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa nhóm hàng này?"
          deleteDescription="Chỉ xóa được khi không có sản phẩm nào thuộc nhóm hàng này."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh mục Nhóm Hàng"
        subtitle="Quản lý và phân loại nhóm vật tư, sản phẩm trong kho"
        icon={<AppstoreOutlined />}
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
            description="Không thể tải danh sách nhóm hàng. Vui lòng thử lại."
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
          dataSource={categories}
          columns={columns}
          rowKey="category_id"
          loading={isLoading}
          emptyTitle="Chưa có nhóm hàng nào"
          emptyDescription="Thêm nhóm hàng đầu tiên để bắt đầu phân loại sản phẩm."
          emptyActionText={canModify ? 'Thêm nhóm hàng' : undefined}
          onEmptyAction={canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingCategory ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingCategory ? 'Cập nhật nhóm hàng' : 'Tạo nhóm hàng mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingCategory ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="category_name"
            label="Tên nhóm hàng"
            rules={[
              { required: true, message: 'Tên nhóm hàng không được để trống!' },
              { max: 100, message: 'Tên nhóm hàng tối đa 100 ký tự!' },
            ]}
          >
            <Input placeholder="Nhập tên nhóm hàng (VD: IC, Tụ điện, PCB...)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
