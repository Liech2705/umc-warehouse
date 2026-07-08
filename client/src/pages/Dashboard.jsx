import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Skeleton, Empty, Alert, Button, Space, Badge } from 'antd';
import {
  AppstoreOutlined,
  ImportOutlined,
  ExportOutlined,
  WarningOutlined,
  AreaChartOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  FireOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';

// ── Custom Tooltip for chart ──────────────────────────────────────
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 13,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          color: 'var(--text-primary)',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: entry.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
          </div>
          <strong style={{ color: entry.color, fontVariantNumeric: 'tabular-nums' }}>
            {Number(entry.value).toLocaleString('vi-VN')}
          </strong>
        </div>
      ))}
    </div>
  );
}

// ── Top Exported Table columns ────────────────────────────────────
const topExportedColumns = [
  {
    title: '#',
    key: 'rank',
    width: 44,
    render: (_, __, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      return (
        <span style={{ fontSize: index < 3 ? 18 : 14, lineHeight: 1 }}>
          {medals[index] || (
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span>
          )}
        </span>
      );
    },
  },
  {
    title: 'Mã SP',
    key: 'product_code',
    render: (_, r) => (
      <span
        style={{
          fontWeight: 600,
          fontFamily: 'monospace',
          fontSize: 11,
          background: 'var(--clr-slate-100)',
          padding: '2px 7px',
          borderRadius: 6,
          color: 'var(--text-secondary)',
        }}
      >
        {r.Product?.product_code || '—'}
      </span>
    ),
  },
  {
    title: 'Tên sản phẩm',
    key: 'product_name',
    render: (_, r) => (
      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
        {r.Product?.product_name || '—'}
      </span>
    ),
  },
  {
    title: 'Số lượng xuất',
    dataIndex: 'total_exported',
    key: 'total_exported',
    align: 'right',
    render: (val, r) => (
      <span
        style={{
          fontWeight: 700,
          color: 'var(--clr-accent-600)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 14,
        }}
      >
        {parseInt(val, 10).toLocaleString('vi-VN')}{' '}
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
          {r.Product?.unit || ''}
        </span>
      </span>
    ),
  },
];

// ── Low Stock Item ────────────────────────────────────────────────
function LowStockItem({ record, index }) {
  const qty = Number(record.total_quantity ?? 0);
  const minStock = Number(record.min_stock ?? 0);
  const ratio = minStock > 0 ? qty / minStock : 1;
  const isOut = ratio === 0;
  const isCritical = ratio > 0 && ratio < 0.5;

  const color = isOut
    ? 'var(--clr-danger-500)'
    : isCritical
    ? 'var(--clr-warning-500)'
    : 'var(--clr-accent-500)';
  const bgColor = isOut
    ? 'var(--clr-danger-100)'
    : isCritical
    ? 'var(--clr-warning-100)'
    : 'var(--clr-accent-100)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: index < 4 ? '1px solid var(--border-subtle)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 6,
            height: 36,
            borderRadius: 3,
            background: color,
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {record.product_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {record.product_code}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: bgColor,
            color: color,
            fontWeight: 700,
            fontSize: 13,
            padding: '2px 9px',
            borderRadius: 9999,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {qty.toLocaleString('vi-VN')} {record.unit}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          Tối thiểu: {minStock.toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        border: '1px solid var(--border-default)',
      }}
    >
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const {
    data: dashboardRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/dashboard/summary');
      return data;
    },
  });

  const dbData = dashboardRes?.data;
  const summary = dbData?.summary || {};
  const chartData = (dbData?.chartData || []).map((item) => ({
    ...item,
    date: dayjs(item.date).format('DD/MM'),
  }));
  const lowStockProducts = dbData?.lowStockProducts || [];
  const topExportedProducts = dbData?.topExportedProducts || [];
  const hasDefective = (summary.totalDefectiveHold ?? 0) > 0;

  if (isError) {
    return (
      <div className="anim-fade-in">
        <PageHeader title="Dashboard" />
        <Card>
          <Alert
            message="Lỗi tải dữ liệu"
            description="Không thể tải dữ liệu Dashboard. Vui lòng thử lại."
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={() => refetch()}>
                Thử lại
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan hoạt động kho hàng theo thời gian thực"
        icon={<AreaChartOutlined />}
      />

      {/* ── Row 1: StatCards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <StatCard
              title="Tổng sản phẩm"
              value={summary.totalProducts ?? 0}
              icon={<AppstoreOutlined />}
              color="#1E3A5F"
              gradient="linear-gradient(135deg, rgba(30,58,95,0.12), rgba(37,99,235,0.08))"
              glowColor="0 8px 25px rgba(30,58,95,0.15)"
              animDelay="0ms"
            />
          )}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <StatCard
              title="Phiếu nhập tháng này"
              value={summary.totalImportsInMonth ?? 0}
              icon={<ImportOutlined />}
              color="#10B981"
              gradient="linear-gradient(135deg, rgba(4,120,87,0.12), rgba(16,185,129,0.08))"
              glowColor="0 8px 25px rgba(16,185,129,0.15)"
              animDelay="60ms"
            />
          )}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <StatCard
              title="Phiếu xuất tháng này"
              value={summary.totalExportsInMonth ?? 0}
              icon={<ExportOutlined />}
              color="#F59E0B"
              gradient="linear-gradient(135deg, rgba(180,83,9,0.12), rgba(245,158,11,0.08))"
              glowColor="0 8px 25px rgba(245,158,11,0.15)"
              animDelay="120ms"
            />
          )}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div style={{ position: 'relative' }}>
              <StatCard
                title="Hàng lỗi chờ xử lý"
                value={summary.totalDefectiveHold ?? 0}
                icon={<WarningOutlined />}
                color="#EF4444"
                gradient="linear-gradient(135deg, rgba(190,18,60,0.12), rgba(239,68,68,0.08))"
                glowColor="0 8px 25px rgba(239,68,68,0.15)"
                animDelay="180ms"
                style={
                  hasDefective
                    ? { border: '1px solid rgba(239,68,68,0.3)', animation: 'pulseGlowRed 2.5s ease-in-out infinite, fadeInUp var(--duration-slow) var(--ease-decelerate) 180ms both' }
                    : {}
                }
              />
              {hasDefective && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '4px 12px',
                    background: 'var(--clr-danger-100)',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                    fontSize: 11,
                    color: 'var(--clr-danger-700)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/defective-items')}
                >
                  <FireOutlined />
                  Cần xử lý ngay — Nhấn để xem
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>

      {/* ── Row 2: Chart + Low Stock ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Area Chart — 60% */}
        <Col xs={24} xl={15}>
          <Card
            title={
              <Space>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                  }}
                >
                  <AreaChartOutlined />
                </span>
                <span>Biến động Nhập / Xuất kho</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                  }}
                >
                  (7 ngày gần nhất)
                </span>
              </Space>
            }
            className="anim-fade-in-up-1"
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 7 }} />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-subtle)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                  />
                  <Area
                    name="Lượng nhập"
                    type="monotone"
                    dataKey="imported"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#gradImport)"
                    dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Area
                    name="Lượng xuất"
                    type="monotone"
                    dataKey="exported"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    fill="url(#gradExport)"
                    dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có giao dịch nào trong 7 ngày qua"
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>

        {/* Low Stock — 40% */}
        <Col xs={24} xl={9}>
          <Card
            title={
              <Space>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #B45309, #F59E0B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                  }}
                >
                  <WarningOutlined />
                </span>
                <span>Sản phẩm sắp hết hàng</span>
                {lowStockProducts.length > 0 && (
                  <Badge
                    count={lowStockProducts.length}
                    style={{ backgroundColor: '#EF4444', fontSize: 10 }}
                  />
                )}
              </Space>
            }
            extra={
              lowStockProducts.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/inventory')}
                  style={{ fontSize: 12, padding: 0 }}
                >
                  Xem tồn kho
                </Button>
              )
            }
            className="anim-fade-in-up-2"
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : lowStockProducts.length > 0 ? (
              <div>
                {lowStockProducts.map((record, i) => (
                  <LowStockItem key={record.product_id} record={record} index={i} />
                ))}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: 'var(--clr-success-600)', fontWeight: 500 }}>
                    ✓ Tồn kho tất cả sản phẩm đang ở mức an toàn
                  </span>
                }
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Row 3: Top Exported ── */}
      <Card
        title={
          <Space>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
              }}
            >
              <TrophyOutlined />
            </span>
            <span>Top 5 sản phẩm xuất nhiều nhất tháng này</span>
          </Space>
        }
        className="anim-fade-in-up-3"
      >
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <DataTable
            dataSource={topExportedProducts}
            columns={topExportedColumns}
            rowKey="product_id"
            pagination={false}
            emptyTitle="Chưa có dữ liệu xuất hàng tháng này"
          />
        )}
      </Card>
    </div>
  );
}
