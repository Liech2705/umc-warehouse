import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  Divider,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, ImportOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function ImportCreate() {
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

  // State theo dõi loại nhập để hiển thị Supplier / Workshop động
  const [importType, setImportType] = useState('NCC');

  // Theo dõi warehouse_id để tải danh sách vị trí kho và tự động reset nếu đổi kho
  const warehouseId = Form.useWatch('warehouse_id', form);

  const { data: locationsRes } = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return { data: [] };
      const { data } = await axiosClient.get('/locations', {
        params: { warehouse_id: warehouseId },
      });
      return data;
    },
    enabled: !!warehouseId,
  });
  const locations = locationsRes?.data || [];

  useEffect(() => {
    const details = form.getFieldValue('details') || [];
    const hasLocation = details.some(
      (item) => item && item.location_id !== undefined && item.location_id !== null
    );
    if (hasLocation) {
      const resetDetails = details.map((item) => ({
        ...item,
        location_id: undefined,
      }));
      form.setFieldsValue({ details: resetDetails });
    }
  }, [warehouseId, form]);

  // 1. Fetch dữ liệu bổ trợ cho các Select
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/suppliers');
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

  const suppliers = suppliersRes?.data || [];
  const workshops = workshopsRes?.data || [];
  const warehouses = warehousesRes?.data || [];
  const products = productsRes?.data || [];

  // 2. Mutation tạo phiếu nhập
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post('/imports', payload);
      return data;
    },
    onSuccess: (res) => {
      message.success(res.message || 'Lập phiếu nhập kho thành công!');
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      navigate('/imports');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu nhập.');
    },
  });

  const handleFormSubmit = (values) => {
    // Định dạng lại các giá trị gửi đi (đặc biệt là expiry_date từ DatePicker sang YYYY-MM-DD)
    const formattedDetails = (values.details || []).map((item) => ({
      ...item,
      expiry_date: item.expiry_date ? item.expiry_date.format('YYYY-MM-DD') : null,
      unit_price: parseFloat(item.unit_price) || 0,
      quantity: parseInt(item.quantity, 10),
      location_id: item.location_id || null,
    }));

    if (formattedDetails.length === 0) {
      message.warning('Vui lòng thêm ít nhất một sản phẩm vào chi tiết phiếu nhập!');
      return;
    }

    const payload = {
      import_type: values.import_type,
      supplier_id: values.import_type === 'NCC' ? values.supplier_id : null,
      workshop_id: values.import_type !== 'NCC' ? values.workshop_id : null,
      warehouse_id: values.warehouse_id,
      note: values.note,
      details: formattedDetails,
    };

    createMutation.mutate(payload);
  };

  return (
    <div style={{ padding: '4px' }}>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/imports')} type="text" />
            <ImportOutlined style={{ color: 'var(--clr-primary-500)', fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Lập Phiếu Nhập Kho Mới</span>
          </Space>
        }
        bordered={false}
        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', borderRadius: 8 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ import_type: 'NCC', details: [{}] }}
        >
          <Divider orientation="left" style={{ margin: '0 0 16px 0', fontSize: 14 }}>
            📝 Thông tin phiếu nhập
          </Divider>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="import_type"
                label="Loại nhập kho"
                rules={[{ required: true, message: 'Vui lòng chọn loại nhập kho!' }]}
              >
                <Select
                  onChange={(val) => {
                    setImportType(val);
                    form.setFieldsValue({ supplier_id: null, workshop_id: null });
                  }}
                  options={[
                    { label: 'Từ nhà cung cấp (NCC)', value: 'NCC' },
                    { label: 'Từ xưởng sản xuất', value: 'XUONG' },
                    { label: 'Xưởng trả lại', value: 'TRA_LAI' },
                  ]}
                />
              </Form.Item>
            </Col>

            {importType === 'NCC' ? (
              <Col xs={24} md={6}>
                <Form.Item
                  name="supplier_id"
                  label="Nhà cung cấp"
                  rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp!' }]}
                >
                  <Select
                    showSearch
                    placeholder="Chọn nhà cung cấp"
                    optionFilterProp="label"
                    options={suppliers.map((s) => ({
                      label: s.supplier_name,
                      value: s.supplier_id,
                    }))}
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} md={6}>
                <Form.Item
                  name="workshop_id"
                  label="Xưởng sản xuất liên quan"
                  rules={[{ required: true, message: 'Vui lòng chọn xưởng!' }]}
                >
                  <Select
                    placeholder="Chọn xưởng"
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
                label="Kho nhận hàng"
                rules={[{ required: true, message: 'Vui lòng chọn kho nhập!' }]}
              >
                <Select
                  placeholder="Chọn kho hàng nhận"
                  options={warehouses.map((w) => ({
                    label: w.warehouse_name,
                    value: w.warehouse_id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item name="note" label="Ghi chú thêm">
                <Input placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '24px 0 16px 0', fontSize: 14 }}>
            📦 Chi tiết sản phẩm nhập kho
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
                          width: '30%',
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
                          width: '12%',
                        }}
                      >
                        Số lượng *
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '13%',
                        }}
                      >
                        Đơn giá (VNĐ)
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
                        Mã lô hàng
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '14%',
                        }}
                      >
                        Hạn dùng
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '14%',
                        }}
                      >
                        Vị trí (tùy chọn)
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '7%',
                        }}
                      >
                        Xóa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name, ...restField }) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'product_id']}
                            rules={[{ required: true, message: 'Chọn sản phẩm!' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              showSearch
                              placeholder="Chọn sản phẩm"
                              optionFilterProp="label"
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
                            <InputNumber min={1} placeholder="SL" style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'unit_price']}
                            initialValue={0}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} placeholder="Đơn giá" style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'batch_code']}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Mã lô" style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'expiry_date']}
                            style={{ marginBottom: 0 }}
                          >
                            <DatePicker placeholder="Hạn dùng" style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'location_id']}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              showSearch
                              placeholder={warehouseId ? 'Vị trí' : 'Chọn kho trước'}
                              optionFilterProp="label"
                              disabled={!warehouseId}
                              allowClear
                              options={locations.map((loc) => ({
                                label: loc.location_code,
                                value: loc.location_id,
                              }))}
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
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
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
                    style={{ width: 200 }}
                  >
                    Thêm dòng sản phẩm
                  </Button>
                </div>
              </div>
            )}
          </Form.List>

          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space size="middle">
              <Button size="large" onClick={() => navigate('/imports')}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
                size="large"
              >
                Lưu & Xác nhận nhập kho
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
