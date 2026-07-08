import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * StatCard — Card thống kê Dashboard nâng cấp
 *
 * Props:
 *   title     {string}  — Tiêu đề card
 *   value     {number|string} — Giá trị hiển thị
 *   icon      {ReactNode} — Icon element
 *   color     {string}  — Màu accent (hex). Mặc định: '#1E3A5F'
 *   gradient  {string}  — CSS gradient string cho icon bg (optional)
 *   glowColor {string}  — CSS box-shadow glow (optional)
 *   trend     {{ value: number, direction: 'up'|'down', label?: string }}
 *   style     {object}  — Style override cho container
 *   animDelay {string}  — CSS animation delay, vd: '100ms'
 */
export default function StatCard({
  title,
  value,
  icon,
  color = '#1E3A5F',
  gradient,
  glowColor,
  trend,
  style,
  animDelay = '0ms',
}) {
  // Derive gradient from color if not provided
  const iconGradient =
    gradient ||
    `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`;

  const hoverGlow =
    glowColor ||
    `0 8px 25px ${color}22, 0 4px 8px ${color}12`;

  return (
    <div
      className="stat-card"
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        cursor: 'default',
        transition:
          'box-shadow var(--transition-normal), transform var(--transition-normal)',
        animation: `fadeInUp var(--duration-slow) var(--ease-decelerate) ${animDelay} both`,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverGlow;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon Block */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: iconGradient,
          border: `1px solid ${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: color,
          flexShrink: 0,
          transition: 'transform var(--transition-spring)',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--weight-semibold)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          {title}
        </div>

        {/* Value */}
        <div
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-extrabold)',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            animation: `countUp var(--duration-slow) var(--ease-decelerate) ${animDelay} both`,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              background:
                trend.direction === 'up'
                  ? 'var(--clr-success-100)'
                  : 'var(--clr-danger-100)',
              color:
                trend.direction === 'up'
                  ? 'var(--clr-success-700)'
                  : 'var(--clr-danger-700)',
            }}
          >
            {trend.direction === 'up' ? (
              <ArrowUpOutlined style={{ fontSize: 10 }} />
            ) : (
              <ArrowDownOutlined style={{ fontSize: 10 }} />
            )}
            <span>{trend.value}%</span>
            {trend.label && (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontWeight: 'var(--weight-regular)',
                }}
              >
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
