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
  Tabs,
  Card,
  InputNumber,
  message,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  WarningOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusTag from '../../components/common/StatusTag';
import PrintButton from '../../components/print/PrintButton';
import ScrapReceiptPrint from '../../components/print/ScrapReceiptPrint';
import usePrint from '../../hooks/usePrint';

export default function DefectiveItemList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const printRef = useRef();
  const handlePrint = usePrint(printRef);

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      // We pass the activeTab as status to the export route
      const response = await axiosClient.get('/defective-items/export', {
        params: { status: activeTab },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `danh_sach_hang_hong_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error(error);
      message.error('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setExportLoading(false);
    }
  };
  const [selectedRecord, setSelectedRecord] = useState(null);

  // State quản lý tab & Modal
  const [activeTab, setActiveTab] = useState('CHO_XU_LY');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Watcher trong Form để hiển thị workshop_id động
  const sourceTypeWatch = Form.useWatch('source_type', form);

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'QuanLy';
  const canReturn = user?.role === 'Admin' || user?.role === 'QuanLy' || user?.role === 'ThuKho';

  // 1. Fetch danh sách hàng lỗi theo trạng thái tab hiện tại
  const {
    data: listRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['defectiveItems', activeTab],
    queryFn: async () => {
      const { data } = await axiosClient.get('/defective-items', {
        params: { status: activeTab },
      });
      return data;
    },
  });

  // 2. Fetch danh sách sản phẩm, kho, xưởng cho Modal Form
  const { data: productsRes } = useQuery({
    queryKey: ['productsAll'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/products', { params: { limit: 1000 } });
      return data;
    },
  });

  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  const { data: workshopsRes } = useQuery({
    queryKey: ['workshops'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/workshops');
      return data;
    },
  });

  const defectiveItems = listRes?.data || [];
  const products = productsRes?.data || [];
  const warehouses = warehousesRes?.data || [];
  const workshops = workshopsRes?.data || [];

  // 3. Mutation khai báo hàng lỗi mới
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post('/defective-items', payload);
      return data;
    },
    onSuccess: (res) => {
      const prodId = form.getFieldValue('product_id');
      const qty = form.getFieldValue('quantity');
      const prod = products.find((p) => p.product_id === prodId);
      const prodName = prod ? prod.product_name : '';
      message.success(`Đã cách ly ${qty} sản phẩm "${prodName}" bị lỗi thành công.`);
      queryClient.invalidateQueries({ queryKey: ['defectiveItems'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Không thể tạo báo cáo hàng lỗi.');
    },
  });

  // 4. Mutation duyệt hủy hàng lỗi
  const scrapMutation = useMutation({
    mutationFn: async ({ id, note }) => {
      const { data } = await axiosClient.post(`/defective-items/${id}/scrap`, { note });
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Phê duyệt hủy hàng thành công.');
      queryClient.invalidateQueries({ queryKey: ['defectiveItems'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi phê duyệt hủy.');
    },
  });

  // 5. Mutation trả hàng về nhà cung cấp
  const returnMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.put(`/defective-items/${id}/return-to-supplier`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Chuyển trạng thái Trả NCC thành công.');
      queryClient.invalidateQueries({ queryKey: ['defectiveItems'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    },
  });

  const handleOpenAddModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleFormSubmit = (values) => {
    createMutation.mutate(values);
  };

  const getSourceTagColor = (type) => {
    if (type === 'Lỗi khi nhập') return 'blue';
    if (type === 'Xưởng trả lỗi') return 'purple';
    return 'orange';
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.Product?.product_name}</div>
          <div style={{ fontSize: 12, color: 'gray' }}>SKU: {record.Product?.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Kho chứa',
      key: 'warehouse',
      render: (_, record) => record.Warehouse?.warehouse_name || 'N/A',
    },
    {
      title: 'Nguồn phát hiện',
      dataIndex: 'source_type',
      key: 'source_type',
      render: (type) => (
        <StatusTag
          status={type}
          statusMap={{
            'Lỗi khi nhập': { label: 'Lỗi nhập kho', color: '#1E3A5F' },
            'Xưởng trả lỗi': { label: 'Xưởng trả lỗi', color: '#9333ea' },
            'Tồn kho hư hỏng': { label: 'Tồn kho hư', color: '#E9A23B' },
          }}
        />
      ),
    },
    {
      title: 'Số lượng lỗi',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val, record) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {val.toLocaleString()} {record.Product?.unit || ''}
        </span>
      ),
    },
    {
      title: 'Lý do lỗi',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Ngày báo cáo',
      dataIndex: 'reported_at',
      key: 'reported_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Người báo cáo',
      key: 'reporter',
      render: (_, record) => record.reporter?.full_name || 'N/A',
    },
    ...(activeTab === 'CHO_XU_LY'
      ? [
          {
            title: 'Hành động duyệt',
            key: 'actions',
            width: 240,
            render: (_, record) => (
              <Space size="small">
                <Popconfirm
                  title="Xác nhận hủy sản phẩm lỗi này?"
                  description="Hành động này sẽ lập tức tạo phiếu hủy (Scrap Receipt) tiêu hủy hàng. Tồn kho đã trừ khi báo lỗi."
                  onConfirm={() =>
                    scrapMutation.mutate({ id: record.defective_id, note: 'Hủy hàng lỗi định kỳ' })
                  }
                  okText="Phê duyệt hủy"
                  cancelText="Hủy bỏ"
                  disabled={!isAdminOrManager}
                >
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={!isAdminOrManager}
                  >
                    Duyệt hủy
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Xác nhận trả về nhà cung cấp?"
                  description="Chuyển trạng thái hàng lỗi sang Trả NCC."
                  onConfirm={() => returnMutation.mutate(record.defective_id)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  disabled={!canReturn}
                >
                  <Button
                    type="default"
                    size="small"
                    icon={<CheckOutlined />}
                    disabled={!canReturn}
                  >
                    Trả NCC
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
    ...(activeTab === 'DA_HUY'
      ? [
          {
            title: 'Hành động',
            key: 'print_action',
            width: 140,
            align: 'center',
            render: (_, record) => (
              <PrintButton
                size="small"
                onClick={() => {
                  setSelectedRecord(record);
                  setTimeout(() => {
                    handlePrint();
                  }, 100);
                }}
              />
            ),
          },
        ]
      : []),
  ];

  const tabItems = [
    { key: 'CHO_XU_LY', label: '⏳ Chờ xử lý' },
    { key: 'DA_HUY', label: '🗑️ Đã hủy bỏ' },
    { key: 'TRA_NCC', label: '📦 Đã trả nhà cung cấp' },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý Sản phẩm Lỗi & Hủy hàng"
        subtitle="Báo cáo, phê duyệt xử lý hàng hỏng, hàng lỗi kỹ thuật từ các phân xưởng"
        icon={<WarningOutlined />}
        extra={
          <Space>
            <Button
              type="primary"
              className="btn-excel"
              icon={<FileExcelOutlined />}
              loading={exportLoading}
              onClick={handleExportExcel}
            >
              Xuất Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>
              Ghi nhận hàng lỗi mới
            </Button>
          </Space>
        }
      />
      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải danh sách sản phẩm lỗi. Vui lòng thử lại."
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
          dataSource={defectiveItems}
          columns={columns}
          rowKey="defective_id"
          loading={isLoading}
          emptyTitle={
            activeTab === 'CHO_XU_LY'
              ? 'Chưa có hàng lỗi nào chờ xử lý'
              : activeTab === 'DA_HUY'
                ? 'Chưa có hàng nào bị hủy bỏ'
                : 'Chưa có hàng nào trả nhà cung cấp'
          }
          emptyDescription={
            activeTab === 'CHO_XU_LY'
              ? 'Tất cả linh kiện hiện tại đều ở trạng thái tốt.'
              : activeTab === 'DA_HUY'
                ? 'Không tìm thấy phiếu hủy nào trong hệ thống.'
                : 'Không tìm thấy lịch sử trả hàng nhà cung cấp.'
          }
        />
      </Card>

      {/* Modal báo lỗi mới */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: 'var(--clr-warning-500)' }} />
            <span>Khai báo hàng lỗi mới</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Báo cáo lỗi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="product_id"
            label="Sản phẩm bị lỗi"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
          >
            <Select
              showSearch
              placeholder="Chọn linh kiện/sản phẩm"
              optionFilterProp="label"
              options={products.map((p) => ({
                label: `[${p.product_code}] ${p.product_name}`,
                value: p.product_id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="warehouse_id"
            label="Kho chứa hàng lỗi"
            rules={[{ required: true, message: 'Vui lòng chọn kho hàng chứa!' }]}
          >
            <Select
              placeholder="Chọn kho phát hiện lỗi"
              options={warehouses.map((w) => ({ label: w.warehouse_name, value: w.warehouse_id }))}
            />
          </Form.Item>

          <Form.Item
            name="source_type"
            label="Nguồn gốc lỗi"
            rules={[{ required: true, message: 'Vui lòng chọn nguồn gốc lỗi!' }]}
          >
            <Select
              placeholder="Chọn nguồn phát hiện lỗi"
              options={[
                { label: 'Lỗi khi nhập kho (NHAP)', value: 'NHAP' },
                { label: 'Xưởng sản xuất trả lỗi (XUONG_TRA)', value: 'XUONG_TRA' },
                { label: 'Tồn kho phát hiện hỏng (TON_LAU)', value: 'TON_LAU' },
              ]}
            />
          </Form.Item>

          {sourceTypeWatch === 'XUONG_TRA' && (
            <Form.Item
              name="workshop_id"
              label="Xưởng trả hàng lỗi"
              rules={[{ required: true, message: 'Vui lòng chọn xưởng phát sinh lỗi!' }]}
            >
              <Select
                placeholder="Chọn xưởng trả lại"
                options={workshops.map((w) => ({ label: w.workshop_name, value: w.workshop_id }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="quantity"
            label="Số lượng lỗi"
            rules={[{ required: true, message: 'Nhập số lượng lỗi cần cách ly!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Số lượng" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do lỗi / Mô tả tình trạng"
            rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
          >
            <Input.TextArea
              placeholder="Mô tả chi tiết tình trạng hỏng (VD: Mạch nứt, chân gãy...)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden printable scrap receipt template */}
      <ScrapReceiptPrint ref={printRef} data={selectedRecord} />
    </div>
  );
}
