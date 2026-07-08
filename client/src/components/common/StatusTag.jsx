/**
 * StatusTag — Badge trạng thái nâng cấp (pill style)
 *
 * Usage:
 *   const STATUS_MAP = {
 *     pending:   { label: 'Chờ xử lý',   color: '#F59E0B' },
 *     approved:  { label: 'Đã duyệt',    color: '#10B981' },
 *     cancelled: { label: 'Đã hủy',      color: '#EF4444' },
 *   };
 *   <StatusTag status="pending" statusMap={STATUS_MAP} />
 *
 * Optional props:
 *   size:  'sm' (default) | 'xs' | 'md'
 *   variant: 'filled' (default) | 'outlined' | 'subtle'
 */
export default function StatusTag({ status, statusMap = {}, size = 'sm', variant = 'subtle' }) {
  const config = statusMap[status] ?? { label: status ?? '—', color: '#94A3B8' };
  const color = config.color;

  // Convert hex to rgba helper (simple inline version)
  const hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(148,163,184,${alpha})`;
    return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
  };

  const sizeStyles = {
    xs: { fontSize: 11, padding: '1px 7px', dotSize: 6 },
    sm: { fontSize: 12, padding: '2px 9px', dotSize: 7 },
    md: { fontSize: 13, padding: '4px 12px', dotSize: 8 },
  };
  const s = sizeStyles[size] || sizeStyles.sm;

  const variantStyles = {
    filled: {
      background: color,
      color: '#FFFFFF',
      border: 'none',
    },
    outlined: {
      background: 'transparent',
      color: color,
      border: `1.5px solid ${color}`,
    },
    subtle: {
      background: hexToRgba(color, 0.10),
      color: color,
      border: `1px solid ${hexToRgba(color, 0.25)}`,
    },
  };
  const vs = variantStyles[variant] || variantStyles.subtle;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: s.fontSize,
        fontWeight: 600,
        padding: s.padding,
        borderRadius: 9999,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        transition: 'all 150ms ease',
        ...vs,
      }}
    >
      <span
        style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: '50%',
          background: variant === 'filled' ? 'rgba(255,255,255,0.6)' : color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {config.label}
    </span>
  );
}
