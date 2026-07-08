import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Checkbox, Card, Row, Col, Typography, Tag, Alert, Button, message } from 'antd';
import axiosClient from '../../api/axiosClient';
import { DatabaseOutlined, FileExcelOutlined } from '@ant-design/icons';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusTag from '../../components/common/StatusTag';

const { Text } = Typography;

export default function InventoryList() {
  const [warehouseId, setWarehouseId] = useState(null);
  const [lowStock, setLowStock] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const response = await axiosClient.get('/inventory/export', {
        params: {
          warehouse_id: warehouseId || undefined,
          low_stock: lowStock ? 'true' : 'false',
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `ton_kho_${today}.xlsx`);
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

  // 1. Fetch danh sách tồn kho realtime
  const {
    data: inventoryRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['inventory', warehouseId, lowStock],
    queryFn: async () => {
      const params = {
        warehouse_id: warehouseId || undefined,
        low_stock: lowStock ? 'true' : undefined,
      };
      const { data } = await axiosClient.get('/inventory', { params });
      return data;
    },
  });

  // 2. Fetch danh sách kho để lọc
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  const inventory = inventoryRes?.data || [];
  const warehouses = warehousesRes?.data || [];

  const columns = [
    {
      title: 'Mã SKU',
      key: 'product_code',
      render: (_, record) => record.Product?.product_code || 'N/A',
      width: 140,
    },
    {
      title: 'Tên linh kiện/sản phẩm',
      key: 'product_name',
      render: (_, record) => record.Product?.product_name || 'N/A',
    },
    {
      title: 'Kho hàng',
      key: 'warehouse_name',
      render: (_, record) => record.Warehouse?.warehouse_name || 'N/A',
    },
    {
      title: 'Vị trí cụ thể',
      key: 'location_code',
      render: (_, record) =>
        record.Location?.location_code ? (
          <Tag color="cyan">{record.Location.location_code}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
      width: 120,
    },
    {
      title: 'Số lượng tồn',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      render: (val, record) => `${val.toLocaleString()} ${record.Product?.unit || ''}`,
    },
    {
      title: 'Ngưỡng tối thiểu',
      key: 'min_stock',
      width: 140,
      render: (_, record) => record.Product?.min_stock?.toLocaleString() || '0',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      render: (_, record) => {
        const isLow = record.quantity < (record.Product?.min_stock || 0);
        return (
          <StatusTag
            status={isLow ? 'low' : 'ok'}
            statusMap={{
              low: { label: 'Sắp hết hàng', color: '#D64545' },
              ok: { label: 'Đủ hàng', color: '#2A9D6F' },
            }}
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Báo cáo Tồn Kho Realtime"
        subtitle="Theo dõi tồn kho hiện tại, cảnh báo sắp hết hàng"
        icon={<DatabaseOutlined />}
        extra={
          <Button
            type="primary"
            className="btn-excel"
            icon={<FileExcelOutlined />}
            loading={exportLoading}
            onClick={handleExportExcel}
          >
            Xuất Excel
          </Button>
        }
      />
      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo kho hàng"
              value={warehouseId}
              allowClear
              onChange={(val) => setWarehouseId(val)}
              options={warehouses.map((w) => ({ label: w.warehouse_name, value: w.warehouse_id }))}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Checkbox checked={lowStock} onChange={(e) => setLowStock(e.target.checked)}>
              Chỉ hiện sản phẩm sắp hết hàng (tồn kho dưới hạn mức)
            </Checkbox>
          </Col>
        </Row>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải báo cáo tồn kho realtime. Vui lòng thử lại."
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
          dataSource={inventory}
          columns={columns}
          rowKey={(record) => `${record.inventory_id}_${record.location_id || 'none'}`}
          loading={isLoading}
          rowClassName={(record) => {
            const isLow = record.quantity < (record.Product?.min_stock || 0);
            return isLow ? 'low-stock-row' : '';
          }}
          emptyTitle="Chưa có tồn kho tại kho này"
          emptyDescription="Vui lòng chọn kho khác hoặc điều chỉnh bộ lọc để xem tồn kho."
        />
      </Card>
    </div>
  );
}
