import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Card,
  InputNumber,
  Typography,
  Descriptions,
  Popconfirm,
  message,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  FormOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import PrintButton from '../../components/print/PrintButton';
import InventoryCheckPrint from '../../components/print/InventoryCheckPrint';
import usePrint from '../../hooks/usePrint';
import PageHeader from '../../components/common/PageHeader';
import StatusTag from '../../components/common/StatusTag';

const { Text } = Typography;

export default function InventoryCheckDetail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const printRef = useRef();
  const handlePrint = usePrint(printRef);

  // State điều phối màn hình
  const [activeCheckId, setActiveCheckId] = useState(null);

  // State quản lý Modal tạo phiếu mới
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // State tạm lưu số đếm thực tế của nhân viên trước khi bấm lưu
  // Cấu trúc: { [check_detail_id]: actual_quantity }
  const [actualQuantities, setActualQuantities] = useState({});

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'QuanLy';

  // 1. Fetch danh sách phiếu kiểm kê
  const {
    data: checksRes,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['inventoryChecks'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/inventory-checks');
      return data;
    },
  });

  // 2. Fetch danh sách kho phục vụ lập phiếu
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data;
    },
  });

  // 3. Fetch chi tiết phiếu kiểm kê được chọn
  const {
    data: activeDetailRes,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['inventoryChecks', activeCheckId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/inventory-checks/${activeCheckId}`);
      return data;
    },
    enabled: !!activeCheckId,
  });

  const checkSheets = checksRes?.data || [];
  const warehouses = warehousesRes?.data || [];
  const activeDetail = activeDetailRes?.data;

  // Đồng bộ số đếm thực tế từ API về State khi mở chi tiết
  useEffect(() => {
    if (activeDetail && activeDetail.InventoryCheckDetails) {
      const qtyMap = {};
      activeDetail.InventoryCheckDetails.forEach((d) => {
        qtyMap[d.check_detail_id] =
          d.actual_quantity !== null ? d.actual_quantity : d.system_quantity;
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActualQuantities(qtyMap);
    }
  }, [activeDetail]);

  // Mutation tạo phiếu
  const createMutation = useMutation({
    mutationFn: async (warehouse_id) => {
      const { data } = await axiosClient.post('/inventory-checks', { warehouse_id });
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Khởi tạo phiếu kiểm kê thành công.');
      queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
      setIsNewModalOpen(false);
      // Mở thẳng sang màn hình nhập liệu phiếu vừa tạo
      setActiveCheckId(res.data.check_id);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi khởi tạo phiếu.');
    },
  });

  // Mutation lưu tạm kết quả
  const saveTempMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        details: Object.keys(actualQuantities).map((key) => ({
          check_detail_id: parseInt(key, 10),
          actual_quantity: actualQuantities[key],
        })),
      };
      const { data } = await axiosClient.put(`/inventory-checks/${activeCheckId}/details`, payload);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Lưu tạm số liệu kiểm kê thành công.');
      queryClient.invalidateQueries({ queryKey: ['inventoryChecks', activeCheckId] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu tạm.');
    },
  });

  // Mutation xác nhận đối chiếu
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post(`/inventory-checks/${activeCheckId}/confirm`);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Xác nhận đối chiếu và điều chỉnh tồn kho thành công!');
      queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryChecks', activeCheckId] });
      setActiveCheckId(null); // Quay lại trang danh sách
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Lỗi đối chiếu dữ liệu.');
    },
  });

  // Thay đổi số đếm thực tế
  const handleQtyChange = (val, detailId) => {
    setActualQuantities((prev) => ({
      ...prev,
      [detailId]: val === null ? 0 : val,
    }));
  };

  // Trình bày danh sách cột cho màn hình chính (Danh sách phiếu)
  const listColumns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'check_id',
      key: 'check_id',
      render: (id) => `PKK-${String(id).padStart(5, '0')}`,
    },
    {
      title: 'Kho kiểm kê',
      key: 'warehouse_name',
      render: (_, record) => record.Warehouse?.warehouse_name || 'N/A',
    },
    {
      title: 'Ngày kiểm kê',
      dataIndex: 'check_date',
      key: 'check_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Người lập phiếu',
      key: 'creator',
      render: (_, record) => record.User?.full_name || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <StatusTag
          status={status}
          statusMap={{
            'Đang kiểm': { label: 'Đang kiểm', color: '#E9A23B' },
            'Đã đối chiếu': { label: 'Đã đối chiếu', color: '#2A9D6F' },
          }}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const isPending = record.status === 'Đang kiểm';
        return (
          <Button
            type="primary"
            ghost
            icon={isPending ? <FormOutlined /> : <EyeOutlined />}
            onClick={() => setActiveCheckId(record.check_id)}
          >
            {isPending ? 'Kiểm đếm' : 'Xem kết quả'}
          </Button>
        );
      },
    },
  ];

  // Trình bày danh sách cột cho bảng chi tiết sản phẩm kiểm kê
  const detailColumns = [
    {
      title: 'Mã sản phẩm',
      key: 'product_code',
      render: (_, record) => record.Product?.product_code || 'N/A',
    },
    {
      title: 'Tên linh kiện/sản phẩm',
      key: 'product_name',
      render: (_, record) => record.Product?.product_name || 'N/A',
    },
    {
      title: 'Đơn vị',
      key: 'unit',
      render: (_, record) => record.Product?.unit || '—',
      width: 100,
    },
    {
      title: 'Số lượng hệ thống',
      dataIndex: 'system_quantity',
      key: 'system_quantity',
      width: 160,
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Số lượng kiểm đếm',
      key: 'actual_quantity',
      width: 180,
      render: (_, record) => {
        const isEditable = activeDetail?.status === 'Đang kiểm';
        const currentVal = actualQuantities[record.check_detail_id];
        return isEditable ? (
          <InputNumber
            min={0}
            value={currentVal !== undefined ? currentVal : record.system_quantity}
            onChange={(val) => handleQtyChange(val, record.check_detail_id)}
            style={{ width: '100%' }}
          />
        ) : (
          record.actual_quantity?.toLocaleString()
        );
      },
    },
    {
      title: 'Chênh lệch',
      key: 'difference',
      width: 140,
      render: (_, record) => {
        const isEditable = activeDetail?.status === 'Đang kiểm';
        const sys = record.system_quantity;
        const act = isEditable
          ? actualQuantities[record.check_detail_id] !== undefined
            ? actualQuantities[record.check_detail_id]
            : sys
          : record.actual_quantity;
        const diff = act - sys;

        if (diff > 0) return <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>+{diff}</Text>;
        if (diff < 0) return <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{diff}</Text>;
        return <Text style={{ color: 'gray' }}>0</Text>;
      },
    },
  ];

  return (
    <div>
      {/* VIEW 1: DANH SÁCH PHIẾU KIỂM KÊ */}
      {!activeCheckId && (
        <>
          <PageHeader
            title="Kiểm kê & Đối chiếu Tồn Kho"
            subtitle="Thực hiện kiểm đếm thực tế, đối chiếu chênh lệch với số liệu hệ thống"
            icon={<AuditOutlined />}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsNewModalOpen(true)}
              >
                Lập phiếu kiểm kê mới
              </Button>
            }
          />
          <Card bordered={false}>
            {isListError && (
              <Alert
                message="Lỗi tải dữ liệu"
                description="Không thể tải danh sách phiếu kiểm kê. Vui lòng thử lại."
                type="error"
                showIcon
                action={
                  <Button size="small" danger onClick={() => refetchList()}>
                    Thử lại
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            <DataTable
              dataSource={checkSheets}
              columns={listColumns}
              rowKey="check_id"
              loading={isListLoading}
              emptyTitle="Chưa có phiếu kiểm kê nào"
              emptyDescription="Lập phiếu kiểm kê đầu tiên để bắt đầu đối chiếu tồn kho."
              emptyActionText="Lập phiếu kiểm kê"
              onEmptyAction={() => setIsNewModalOpen(true)}
            />
          </Card>
        </>
      )}

      {/* 2. VIEW 2: TRANG THỰC HIỆN KIỂM KÊ & ĐỐI CHIẾU */}
      {activeCheckId && (
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setActiveCheckId(null)}
                type="text"
              />
              <span>
                Thực hiện kiểm kê phiếu:{' '}
                <Text type="danger" strong>
                  PKK-{String(activeCheckId).padStart(5, '0')}
                </Text>
              </span>
            </Space>
          }
          extra={
            activeDetail?.status === 'Đã đối chiếu' && (
              <PrintButton type="primary" onClick={handlePrint} />
            )
          }
          bordered={false}
          style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', borderRadius: 8 }}
        >
          {isDetailLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              Đang tải dữ liệu phiếu kiểm kê...
            </div>
          ) : isDetailError ? (
            <div style={{ padding: 16 }}>
              <Alert
                message="Lỗi tải chi tiết"
                description="Không thể tải chi tiết phiếu kiểm kê này. Vui lòng thử lại."
                type="error"
                showIcon
                action={
                  <Button size="small" danger onClick={() => refetchDetail()}>
                    Thử lại
                  </Button>
                }
              />
            </div>
          ) : (
            <div>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Mã kiểm kê">
                  PKK-{String(activeCheckId).padStart(5, '0')}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái phiếu">
                  <StatusTag
                    status={activeDetail?.status}
                    statusMap={{
                      'Đang kiểm': { label: 'Đang kiểm', color: '#E9A23B' },
                      'Đã đối chiếu': { label: 'Đã đối chiếu', color: '#2A9D6F' },
                    }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Kho kiểm kê">
                  {activeDetail?.Warehouse?.warehouse_name}
                </Descriptions.Item>
                <Descriptions.Item label="Địa điểm kho">
                  {activeDetail?.Warehouse?.location || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo phiếu">
                  {dayjs(activeDetail?.check_date).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Người lập phiếu">
                  {activeDetail?.User?.full_name}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
                Danh sách chi tiết linh kiện kiểm đếm
              </Divider>

              <Table
                dataSource={activeDetail?.InventoryCheckDetails || []}
                columns={detailColumns}
                rowKey="check_detail_id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />

              {activeDetail?.status === 'Đang kiểm' && (
                <div style={{ textAlign: 'right', marginTop: 24 }}>
                  <Space size="middle">
                    <Button
                      icon={<SaveOutlined />}
                      onClick={() => saveTempMutation.mutate()}
                      loading={saveTempMutation.isPending}
                      size="large"
                    >
                      Lưu tạm số liệu
                    </Button>

                    <Popconfirm
                      title="Xác nhận đối chiếu kiểm kê?"
                      description="Hành động này sẽ cập nhật lại số lượng tồn kho khả dụng của hệ thống khớp với số đếm thực tế và lưu lịch sử điều chỉnh. Không thể hoàn tác!"
                      onConfirm={() => confirmMutation.mutate()}
                      okText="Đối chiếu"
                      cancelText="Hủy"
                      disabled={!isAdminOrManager}
                    >
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={confirmMutation.isPending}
                        disabled={!isAdminOrManager}
                        size="large"
                      >
                        Xác nhận đối chiếu (Admin/Quản lý)
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Modal chọn kho lập phiếu mới */}
      <Modal
        title="➕ Khởi tạo phiếu kiểm kê mới"
        open={isNewModalOpen}
        onCancel={() => setIsNewModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Khởi tạo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values.warehouse_id)}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="warehouse_id"
            label="Chọn kho thực hiện kiểm kê"
            rules={[{ required: true, message: 'Vui lòng chọn kho để kiểm kê!' }]}
          >
            <Select
              placeholder="Chọn kho hàng cần kiểm"
              options={warehouses.map((w) => ({ label: w.warehouse_name, value: w.warehouse_id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden printable inventory check report */}
      <InventoryCheckPrint ref={printRef} data={activeDetail} />
    </div>
  );
}
