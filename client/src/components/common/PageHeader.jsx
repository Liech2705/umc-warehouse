/**
 * PageHeader — Tiêu đề trang dùng chung (nâng cấp)
 *
 * Usage:
 *   <PageHeader
 *     title="Quản lý Phiếu Nhập Kho"
 *     icon={<ImportOutlined />}
 *     subtitle="Theo dõi toàn bộ phiếu nhập và chi tiết hàng hóa"
 *     extra={<Button>Tạo mới</Button>}
 *   />
 */
export default function PageHeader({ title, icon, extra, subtitle }) {
  return (
    <div
      className="anim-fade-in"
      style={{
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: '1px solid var(--border-default)',
        position: 'relative',
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          width: 80,
          height: 2,
          background: 'linear-gradient(90deg, var(--clr-accent-500), var(--clr-primary-500), transparent)',
          borderRadius: 2,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--clr-primary-700), var(--clr-primary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#FFFFFF',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(30,58,95,0.3)',
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        {extra && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}
