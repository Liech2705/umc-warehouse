import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Select, DatePicker, Button, Typography, Space, Alert } from 'antd';
import { HistoryOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusTag from '../../components/common/StatusTag';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const CHANGE_TYPE_MAP = {
  Nhập: { label: 'Nhập kho', color: '#2A9D6F' },
  Xuất: { label: 'Xuất kho', color: '#1E3A5F' },
  Hủy: { label: 'Hủy hàng', color: '#D64545' },
  'Điều chỉnh kiểm kê': { label: 'Điều chỉnh kiểm kê', color: '#E9A23B' },
};

export default function StockHistoryList() {
  const [changeType, setChangeType] = useState(null);
  const [productId, setProductId] = useState(null);
  const [warehouseId, setWarehouseId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 1. Fetch stock history
  const {
    data: historyResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'stockHistory',
      changeType,
      productId,
      warehouseId,
      dateRange?.[0]?.format('YYYY-MM-DD'),
      dateRange?.[1]?.format('YYYY-MM-DD'),
      page,
      limit,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit,
        change_type: changeType || undefined,
        product_id: productId || undefined,
        warehouse_id: warehouseId || undefined,
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].format('YYYY-MM-DD');
        params.to = dateRange[1].format('YYYY-MM-DD');
      }

      const { data } = await axiosClient.get('/stock-history', { params });
      return data;
    },
  });

  // 2. Fetch warehouses for dropdown
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehousesAll'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  // 3. Fetch products for dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['productsAll'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/products', { params: { limit: 1000 } });
      return data;
    },
  });

  const historyData = historyResponse?.data || [];
  const totalItems = historyResponse?.pagination?.totalItems || 0;
  const warehouses = warehousesRes?.data || [];
  const products = productsRes?.data || [];

  const handleResetFilters = () => {
    setChangeType(null);
    setProductId(null);
    setWarehouseId(null);
    setDateRange(null);
    setPage(1);
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <div>
          <Text strong>{record.Product?.product_name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mã: {record.Product?.product_code || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Kho hàng',
      key: 'warehouse',
      render: (_, record) => record.Warehouse?.warehouse_name || 'N/A',
    },
    {
      title: 'Loại biến động',
      dataIndex: 'change_type',
      key: 'change_type',
      render: (type) => <StatusTag status={type} statusMap={CHANGE_TYPE_MAP} />,
    },
    {
      title: 'Số lượng thay đổi',
      dataIndex: 'quantity_change',
      key: 'quantity_change',
      align: 'right',
      render: (val, record) => {
        const isPositive = val > 0;
        return (
          <span style={{ color: isPositive ? '#2A9D6F' : '#D64545', fontWeight: 'bold' }}>
            {isPositive ? `+${val}` : val} {record.Product?.unit || ''}
          </span>
        );
      },
    },
    {
      title: 'Người thực hiện',
      key: 'user',
      render: (_, record) => record.User?.full_name || 'Hệ thống',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lịch sử biến động kho"
        subtitle="Nhật ký chi tiết các giao dịch nhập kho, xuất kho, hủy hàng và điều chỉnh kiểm kê"
        icon={<HistoryOutlined />}
      />

      <Card bordered={false}>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải lịch sử biến động kho. Vui lòng thử lại."
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

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Loại biến động"
              value={changeType}
              allowClear
              onChange={(val) => {
                setChangeType(val);
                setPage(1);
              }}
              options={Object.keys(CHANGE_TYPE_MAP).map((key) => ({
                label: CHANGE_TYPE_MAP[key].label,
                value: key,
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Chọn sản phẩm"
              value={productId}
              allowClear
              onChange={(val) => {
                setProductId(val);
                setPage(1);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={products.map((p) => ({
                label: `${p.product_name} (${p.product_code})`,
                value: p.product_id,
              }))}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn kho hàng"
              value={warehouseId}
              allowClear
              onChange={(val) => {
                setWarehouseId(val);
                setPage(1);
              }}
              options={warehouses.map((w) => ({
                label: w.warehouse_name,
                value: w.warehouse_id,
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setPage(1);
              }}
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button icon={<ClearOutlined />} onClick={handleResetFilters} block>
              Reset
            </Button>
          </Col>
        </Row>

        <DataTable
          dataSource={historyData}
          columns={columns}
          rowKey="history_id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: limit,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} lượt`,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
          }}
          emptyTitle="Không có lịch sử biến động"
          emptyDescription="Chưa có giao dịch kho nào được thực hiện hoặc hãy điều chỉnh lại bộ lọc."
        />
      </Card>
    </div>
  );
}
