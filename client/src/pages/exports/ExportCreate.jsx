import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  Divider,
  message,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, ExportOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function ExportCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Cảnh báo rời trang khi form có dữ liệu chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (form.isFieldsTouched()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form]);

  // State theo dõi loại xuất để hiển thị Workshop động
  const [exportType, setExportType] = useState('XUONG_SX');

  // Watch warehouse_id và details phục vụ tính toán tồn kho realtime
  const warehouseId = Form.useWatch('warehouse_id', form);
  const detailsWatch = Form.useWatch('details', form) || [];

  // State lưu số lượng tồn kho khả dụng của từng dòng: { [index]: totalQuantity }
  const [availableStocks, setAvailableStocks] = useState({});

  // 1. Fetch dữ liệu bổ trợ cho các Select
  const { data: workshopsRes } = useQuery({
    queryKey: ['workshops'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/workshops');
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

  const { data: productsRes } = useQuery({
    queryKey: ['productsAll'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/products', { params: { limit: 1000 } });
      return data;
    },
  });

  const workshops = workshopsRes?.data || [];
  const warehouses = warehousesRes?.data || [];
  const products = productsRes?.data || [];

  // Hàm truy vấn số dư tồn kho của sản phẩm trong kho được chọn
  const checkInventoryStock = async (productId, index) => {
    if (!warehouseId) {
      message.warning('Vui lòng lựa chọn kho xuất hàng trước khi chọn sản phẩm!');
      // Reset sản phẩm vừa chọn
      const currentDetails = form.getFieldValue('details');
      currentDetails[index].product_id = null;
      form.setFieldsValue({ details: currentDetails });
      return;
    }

    try {
      const { data } = await axiosClient.get('/inventory', {
        params: { warehouse_id: warehouseId },
      });
      // Tính tổng số lượng của sản phẩm này (cộng gộp từ tất cả các vị trí trong kho)
      const matches = (data.data || []).filter((item) => item.product_id === productId);
      const totalStock = matches.reduce((sum, item) => sum + item.quantity, 0);

      setAvailableStocks((prev) => ({
        ...prev,
        [index]: totalStock,
      }));
    } catch {
      message.error('Không thể kiểm tra tồn kho của sản phẩm.');
    }
  };

  // 2. Mutation tạo phiếu xuất
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post('/exports', payload);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Lập phiếu xuất kho thành công!');
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/exports');
    },
    onError: (err) => {
      // Hiển thị lỗi tồn kho hoặc lỗi hệ thống chi tiết từ Backend
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu xuất.');
    },
  });

  const handleFormSubmit = (values) => {
    const formattedDetails = (values.details || []).map((item) => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      batch_code: item.batch_code || null,
    }));

    if (formattedDetails.length === 0) {
      message.warning('Vui lòng thêm ít nhất một sản phẩm vào chi tiết phiếu xuất!');
      return;
    }

    // Kiểm tra nhanh phía FE xem có dòng nào xuất vượt định mức tồn kho khả dụng không
    let hasOverStock = false;
    formattedDetails.forEach((item, index) => {
      const stock = availableStocks[index] || 0;
      if (item.quantity > stock) {
        hasOverStock = true;
      }
    });

    if (hasOverStock) {
      message.error('Lỗi: Có sản phẩm vượt quá số lượng tồn khả dụng trong kho!');
      return;
    }

    const payload = {
      export_type: values.export_type,
      workshop_id: values.export_type === 'XUONG_SX' ? values.workshop_id : null,
      warehouse_id: values.warehouse_id,
      note: values.note,
      details: formattedDetails,
    };

    createMutation.mutate(payload);
  };

  return (
    <div style={{ padding: '4px' }}>
      {createMutation.isError && (
        <Alert
          message="Lỗi lập phiếu xuất"
          description={
            createMutation.error.response?.data?.message || 'Không thể tạo phiếu xuất kho.'
          }
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          closable
        />
      )}

      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exports')} type="text" />
            <ExportOutlined style={{ color: 'var(--clr-primary-500)', fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Lập Phiếu Xuất Kho Mới</span>
          </Space>
        }
        bordered={false}
        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', borderRadius: 8 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ export_type: 'XUONG_SX', details: [{}] }}
        >
          <Divider orientation="left" style={{ margin: '0 0 16px 0', fontSize: 14 }}>
            📝 Thông tin phiếu xuất
          </Divider>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="export_type"
                label="Loại xuất kho"
                rules={[{ required: true, message: 'Vui lòng chọn loại xuất kho!' }]}
              >
                <Select
                  onChange={(val) => {
                    setExportType(val);
                    form.setFieldsValue({ workshop_id: null });
                  }}
                  options={[
                    { label: 'Xuất cho xưởng SX', value: 'XUONG_SX' },
                    { label: 'Xuất bán', value: 'BAN' },
                    { label: 'Xuất trả NCC', value: 'TRA_NCC' },
                  ]}
                />
              </Form.Item>
            </Col>

            {exportType === 'XUONG_SX' && (
              <Col xs={24} md={6}>
                <Form.Item
                  name="workshop_id"
                  label="Xưởng sản xuất nhận hàng"
                  rules={[{ required: true, message: 'Vui lòng chọn xưởng!' }]}
                >
                  <Select
                    placeholder="Chọn xưởng sản xuất"
                    options={workshops.map((w) => ({
                      label: w.workshop_name,
                      value: w.workshop_id,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={6}>
              <Form.Item
                name="warehouse_id"
                label="Kho xuất hàng"
                rules={[{ required: true, message: 'Vui lòng chọn kho xuất!' }]}
              >
                <Select
                  placeholder="Chọn kho hàng xuất"
                  onChange={() => {
                    // Reset stocks state
                    setAvailableStocks({});
                    // Reset details fields to prevent incorrect stock checks
                    const currentDetails = form.getFieldValue('details') || [];
                    const resetDetails = currentDetails.map((item) => ({
                      ...item,
                      product_id: null,
                      quantity: null,
                    }));
                    form.setFieldsValue({ details: resetDetails });
                  }}
                  options={warehouses.map((w) => ({
                    label: w.warehouse_name,
                    value: w.warehouse_id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={exportType === 'XUONG_SX' ? 6 : 12}>
              <Form.Item name="note" label="Ghi chú thêm">
                <Input placeholder="Nhập ghi chú xuất kho" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '24px 0 16px 0', fontSize: 14 }}>
            📦 Chi tiết sản phẩm xuất kho
          </Divider>

          {/* Form.List dạng bảng */}
          <Form.List name="details">
            {(fields, { add, remove }) => (
              <div
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  overflowX: 'auto',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-default)' }}>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '45%',
                        }}
                      >
                        Linh kiện / Sản phẩm *
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '15%',
                        }}
                      >
                        Số lượng xuất *
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '15%',
                        }}
                      >
                        Tồn hiện có
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '17%',
                        }}
                      >
                        Mã lô hàng
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '8%',
                        }}
                      >
                        Xóa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name, ...restField }) => {
                      const selectedProductId = detailsWatch[name]?.product_id;
                      const qtyInput = detailsWatch[name]?.quantity || 0;
                      const availableStock = availableStocks[name] || 0;
                      const isOverStock = selectedProductId && qtyInput > availableStock;

                      return (
                        <tr key={key} style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'product_id']}
                              rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                showSearch
                                placeholder="Tìm kiếm sản phẩm trong kho..."
                                optionFilterProp="label"
                                disabled={!warehouseId}
                                onChange={(val) => checkInventoryStock(val, name)}
                                options={products.map((p) => ({
                                  label: `[${p.product_code}] ${p.product_name}`,
                                  value: p.product_id,
                                }))}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </td>
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantity']}
                              rules={[{ required: true, message: 'Nhập số lượng!' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={1}
                                placeholder="SL xuất"
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            }}
                          >
                            {selectedProductId ? (
                              <div>
                                <span
                                  style={{
                                    fontWeight: 'bold',
                                    color: isOverStock ? '#D64545' : '#2A9D6F',
                                    fontSize: 14,
                                  }}
                                >
                                  {availableStock}
                                </span>
                                {isOverStock && (
                                  <div style={{ fontSize: 10, color: '#D64545' }}>
                                    Vượt định mức
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'batch_code']}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="Mã lô (nếu có)" style={{ width: '100%' }} />
                            </Form.Item>
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            }}
                          >
                            {fields.length > 1 && (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  remove(name);
                                  const newStocks = { ...availableStocks };
                                  delete newStocks[name];
                                  setAvailableStocks(newStocks);
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-default)',
                    background: 'var(--table-header-bg)',
                  }}
                >
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    disabled={!warehouseId}
                    style={{ width: 250 }}
                  >
                    {!warehouseId ? 'Vui lòng chọn kho hàng xuất trước' : 'Thêm dòng sản phẩm mới'}
                  </Button>
                </div>
              </div>
            )}
          </Form.List>

          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space size="middle">
              <Button size="large" onClick={() => navigate('/exports')}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
                size="large"
              >
                Lưu & Xác nhận xuất kho
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
