import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, message, Card, Select, InputNumber, Alert, Space } from 'antd';
import { PlusOutlined, SearchOutlined, BarcodeOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ActionButtons from '../../components/common/ActionButtons';

export default function ProductList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // State bộ lọc và phân trang
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const canModify = user?.role === 'Admin' || user?.role === 'ThuKho';
  const canDelete = user?.role === 'Admin';

  // 1. Fetch danh sách sản phẩm (có filter & phân trang)
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['products', keyword, page, limit],
    queryFn: async () => {
      const { data } = await axiosClient.get('/products', {
        params: {
          keyword: keyword.trim() || undefined,
          page,
          limit,
        },
      });
      return data;
    },
  });

  // 2. Fetch danh sách nhóm hàng (để chọn trong Form)
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/categories');
      return data;
    },
  });

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const totalItems = productsResponse?.pagination?.totalItems || 0;

  // 3. Create
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await axiosClient.post('/products', newData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã tạo sản phẩm "${res.data?.product_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 4. Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosClient.put(`/products/${id}`, updatedData);
      return data;
    },
    onSuccess: (res) => {
      message.success(`Đã cập nhật sản phẩm "${res.data?.product_name || ''}"`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleCloseModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // 5. Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/products/${id}`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xóa sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể xóa sản phẩm này');
    },
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      product_code: record.product_code,
      product_name: record.product_name,
      category_id: record.category_id,
      unit: record.unit,
      min_stock: record.min_stock,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.product_id,
        updatedData: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'Mã SKU',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 140,
    },
    {
      title: 'Tên linh kiện/sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Nhóm hàng',
      key: 'category_name',
      render: (_, record) => record.Category?.category_name || 'N/A',
    },
    {
      title: 'Đơn vị tính',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
    },
    {
      title: 'Định mức tồn tối thiểu',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 180,
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => handleOpenEditModal(record)}
          onDelete={() => deleteMutation.mutate(record.product_id)}
          canEdit={canModify}
          canDelete={canDelete}
          deleteTitle="Xóa sản phẩm này?"
          deleteDescription="Chỉ xóa được khi sản phẩm chưa phát sinh giao dịch nhập/xuất kho."
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh mục Linh kiện & Hàng hóa"
        subtitle="Quản lý chi tiết các mã sản phẩm, vật tư, SKU và mức tồn kho tối thiểu"
        icon={<BarcodeOutlined />}
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
            description="Không thể tải danh sách sản phẩm. Vui lòng thử lại."
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
        <div style={{ marginBottom: 16, maxWidth: 400 }}>
          <Input.Search
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            enterButton={
              <Button type="primary" icon={<SearchOutlined />}>
                Tìm kiếm
              </Button>
            }
            allowClear
            onSearch={(value) => {
              setKeyword(value);
              setPage(1);
            }}
          />
        </div>
        <DataTable
          dataSource={products}
          columns={columns}
          rowKey="product_id"
          loading={isProductsLoading}
          pagination={{
            current: page,
            pageSize: limit,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} bản ghi`,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
          }}
          emptyTitle="Không tìm thấy sản phẩm nào"
          emptyDescription="Thử đổi từ khóa tìm kiếm hoặc thêm sản phẩm mới."
          emptyActionText={!keyword && canModify ? 'Thêm sản phẩm' : undefined}
          onEmptyAction={!keyword && canModify ? handleOpenAddModal : undefined}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingProduct ? (
              <EditOutlined style={{ color: 'var(--clr-primary-500)' }} />
            ) : (
              <PlusOutlined style={{ color: 'var(--clr-success-500)' }} />
            )}
            <span>{editingProduct ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingProduct ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="product_code"
            label="Mã SKU sản phẩm"
            rules={[
              { required: true, message: 'Mã SKU không được để trống!' },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: 'Mã SKU chỉ bao gồm chữ, số, gạch nối hoặc gạch dưới!',
              },
            ]}
          >
            <Input placeholder="Nhập mã sản phẩm (VD: IC-STM32F103)" disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            name="product_name"
            label="Tên sản phẩm/linh kiện"
            rules={[{ required: true, message: 'Tên sản phẩm không được để trống!' }]}
          >
            <Input placeholder="Nhập tên chi tiết sản phẩm" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Nhóm hàng"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm hàng!' }]}
          >
            <Select
              placeholder="Chọn nhóm hàng"
              loading={isCategoriesLoading}
              options={categories.map((c) => ({
                label: c.category_name,
                value: c.category_id,
              }))}
            />
          </Form.Item>

          <Form.Item name="unit" label="Đơn vị tính">
            <Input placeholder="VD: Cái, Sợi, Cuộn, Tấm..." />
          </Form.Item>

          <Form.Item
            name="min_stock"
            label="Số lượng tồn tối thiểu để cảnh báo"
            rules={[{ required: true, message: 'Định mức tồn tối thiểu không được để trống!' }]}
            initialValue={10}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số lượng cảnh báo" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sản phẩm">
            <Input.TextArea placeholder="Nhập thông số kỹ thuật hoặc mô tả chi tiết..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
