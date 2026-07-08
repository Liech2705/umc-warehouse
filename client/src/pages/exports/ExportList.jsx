import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  Space,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Divider,
  Typography,
  Descriptions,
  Spin,
  Alert,
  message,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  ClearOutlined,
  ExportOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusTag from '../../components/common/StatusTag';
import PrintButton from '../../components/print/PrintButton';
import ExportReceiptPrint from '../../components/print/ExportReceiptPrint';
import usePrint from '../../hooks/usePrint';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function ExportList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const printRef = useRef();
  const handlePrint = usePrint(printRef);

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = {
        warehouse_id: warehouseId || undefined,
        export_type: exportType || undefined,
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await axiosClient.get('/exports/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `danh_sach_xuat_kho_${today}.xlsx`);
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

  // State bộ lọc và phân trang
  const [warehouseId, setWarehouseId] = useState(null);
  const [exportType, setExportType] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // State chi tiết phiếu xuất
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreate = user?.role === 'Admin' || user?.role === 'ThuKho';

  // 1. Fetch danh sách phiếu xuất
  const {
    data: exportsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['exports', warehouseId, exportType, dateRange, page, limit],
    queryFn: async () => {
      const params = {
        page,
        limit,
        warehouse_id: warehouseId || undefined,
        export_type: exportType || undefined,
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const { data } = await axiosClient.get('/exports', { params });
      return data;
    },
  });

  // 2. Fetch danh sách kho phục vụ bộ lọc
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  // 3. Fetch chi tiết phiếu xuất khi mở Modal
  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: ['exports', selectedId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/exports/${selectedId}`);
      return data;
    },
    enabled: !!selectedId,
  });

  const exports = exportsResponse?.data || [];
  const totalItems = exportsResponse?.pagination?.totalItems || 0;
  const warehouses = warehousesRes?.data || [];
  const detailData = detailRes?.data;

  const handleOpenDetail = (id) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleResetFilters = () => {
    setWarehouseId(null);
    setExportType(null);
    setDateRange(null);
    setPage(1);
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'export_code',
      key: 'export_code',
      render: (code, record) => (
        <Button
          type="link"
          onClick={() => handleOpenDetail(record.export_id)}
          style={{ padding: 0, fontWeight: 600 }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: 'Loại xuất',
      dataIndex: 'export_type',
      key: 'export_type',
      render: (type) => (
        <StatusTag
          status={type}
          statusMap={{
            'Xuất cho xưởng SX': { label: 'Xuất xưởng', color: '#2A9D6F' },
            'Xuất bán': { label: 'Xuất bán', color: '#1E3A5F' },
            'Xuất trả NCC': { label: 'Trả NCC', color: '#D64545' },
          }}
        />
      ),
    },
    {
      title: 'Kho xuất',
      key: 'warehouse_name',
      render: (_, record) => record.Warehouse?.warehouse_name || 'N/A',
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'export_date',
      key: 'export_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Người xuất kho',
      key: 'creator',
      render: (_, record) => record.User?.full_name || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(record.export_id)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const detailColumns = [
    {
      title: 'Mã sản phẩm',
      key: 'product_code',
      render: (_, record) => record.Product?.product_code || 'N/A',
    },
    {
      title: 'Tên sản phẩm',
      key: 'product_name',
      render: (_, record) => record.Product?.product_name || 'N/A',
    },
    {
      title: 'Số lượng xuất',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val, record) => `${val.toLocaleString()} ${record.Product?.unit || ''}`,
    },
    {
      title: 'Mã lô',
      dataIndex: 'batch_code',
      key: 'batch_code',
      render: (val) => val || <Text type="secondary">—</Text>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý Phiếu Xuất Kho"
        subtitle="Theo dõi và quản lý toàn bộ phiếu xuất hàng hóa ra khỏi kho"
        icon={<ExportOutlined />}
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!canCreate}
              onClick={() => navigate('/exports/create')}
            >
              Lập phiếu mới
            </Button>
          </Space>
        }
      />
      <Card bordered={false}>
        {isError && (
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải danh sách phiếu xuất kho. Vui lòng thử lại."
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
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo kho xuất"
              value={warehouseId}
              allowClear
              onChange={(val) => {
                setWarehouseId(val);
                setPage(1);
              }}
              options={warehouses.map((w) => ({ label: w.warehouse_name, value: w.warehouse_id }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo loại xuất"
              value={exportType}
              allowClear
              onChange={(val) => {
                setExportType(val);
                setPage(1);
              }}
              options={[
                { label: 'Xuất cho xưởng SX', value: 'XUONG_SX' },
                { label: 'Xuất bán', value: 'BAN' },
                { label: 'Xuất trả NCC', value: 'TRA_NCC' },
              ]}
            />
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setPage(1);
              }}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Button icon={<ClearOutlined />} onClick={handleResetFilters} block>
              Reset bộ lọc
            </Button>
          </Col>
        </Row>
        <DataTable
          dataSource={exports}
          columns={columns}
          rowKey="export_id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: limit,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} phiếu`,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
          }}
          emptyTitle="Không có phiếu xuất nào"
          emptyDescription="Lập phiếu xuất mới hoặc điều chỉnh bộ lọc."
        />
      </Card>

      {/* Modal chi tiết phiếu xuất */}
      <Modal
        title={
          <Space>
            <span>📄 Chi tiết phiếu xuất kho:</span>
            <Text type="danger" strong>
              {detailData?.export_code}
            </Text>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseDetail}
        footer={[
          <PrintButton
            key="print"
            type="primary"
            onClick={handlePrint}
            style={{ marginRight: 8 }}
          />,
          <Button key="close" onClick={handleCloseDetail}>
            Đóng
          </Button>,
        ]}
        width={900}
        style={{ maxWidth: '90vw' }}
        destroyOnClose
      >
        {isDetailLoading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Spin size="default" />
            <div style={{ marginTop: 8, color: '#8c8c8c' }}>Đang tải thông tin chi tiết...</div>
          </div>
        ) : (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Mã phiếu">{detailData?.export_code}</Descriptions.Item>
              <Descriptions.Item label="Loại xuất kho">
                <StatusTag
                  status={detailData?.export_type}
                  statusMap={{
                    'Xuất cho xưởng SX': { label: 'Xuất xưởng', color: '#2A9D6F' },
                    'Xuất bán': { label: 'Xuất bán', color: '#1E3A5F' },
                    'Xuất trả NCC': { label: 'Trả NCC', color: '#D64545' },
                  }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Kho xuất">
                {detailData?.Warehouse?.warehouse_name}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày xuất kho">
                {dayjs(detailData?.export_date).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Người lập phiếu">
                {detailData?.User?.full_name} ({detailData?.User?.username})
              </Descriptions.Item>
              {detailData?.export_type === 'Xuất cho xưởng SX' && (
                <Descriptions.Item label="Xưởng nhận hàng">
                  {detailData?.Workshop?.workshop_name}
                </Descriptions.Item>
              )}
              <Descriptions.Item
                label="Ghi chú"
                span={detailData?.export_type === 'Xuất cho xưởng SX' ? 1 : 2}
              >
                {detailData?.note || <Text type="secondary">Không có ghi chú</Text>}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
              Danh sách chi tiết linh kiện xuất kho
            </Divider>

            <Table
              dataSource={detailData?.ExportDetails || []}
              columns={detailColumns}
              rowKey="export_detail_id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}
      </Modal>

      {/* Hidden printable receipt template */}
      <ExportReceiptPrint ref={printRef} data={detailData} />
    </div>
  );
}
