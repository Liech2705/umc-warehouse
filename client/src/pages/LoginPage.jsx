import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, DatabaseOutlined, AreaChartOutlined, SwapOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/auth/login', values);
      login(data.user, data.token);
      message.success(`Chào mừng trở lại, ${data.user.full_name}!`);
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#050D1A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ─── Animated Background Orbs ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Gradient mesh */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(30,58,95,0.6) 0%, transparent 60%), ' +
              'radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.2) 0%, transparent 50%), ' +
              'radial-gradient(ellipse at 60% 80%, rgba(245,158,11,0.1) 0%, transparent 40%)',
          }}
        />
        {/* Orb 1 */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
            animation: 'orbFloat 12s ease-in-out infinite',
          }}
        />
        {/* Orb 2 */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-5%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            animation: 'orbFloat 14s ease-in-out infinite reverse',
          }}
        />
        {/* Orb 3 */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '30%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            animation: 'orbFloat 10s ease-in-out infinite 2s',
          }}
        />
        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ─── Left Panel: Branding ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '60px 80px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '55%',
        }}
        className="login-left-panel"
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 60,
            animation: 'fadeInUp 600ms ease both',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #E30613, #FF4D4D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(227,6,19,0.4)',
            }}
          >
            <svg viewBox="0 0 24 24" width={26} height={26}>
              <circle cx="12" cy="6" r="3.5" fill="#FFFFFF" />
              <path d="M 3,17 C 7,10 10.5,10 12,12.5 C 13.5,10 17,10 21,17 C 16.5,14 7.5,14 3,17 Z" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>
              UMC WMS
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.06em' }}>
              WAREHOUSE MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ animation: 'fadeInUp 600ms ease 100ms both' }}>
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 16px',
              letterSpacing: '-0.02em',
            }}
          >
            Quản lý kho
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              thông minh
            </span>
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 420,
              margin: 0,
            }}
          >
            Hệ thống quản lý kho toàn diện — theo dõi tồn kho, nhập xuất hàng,
            kiểm kê và báo cáo theo thời gian thực.
          </p>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 48,
            animation: 'fadeInUp 600ms ease 200ms both',
          }}
        >
          {[
            { icon: <DatabaseOutlined style={{ color: 'var(--clr-primary-400)' }} />, label: 'Quản lý tồn kho' },
            { icon: <AreaChartOutlined style={{ color: 'var(--clr-success-400)' }} />, label: 'Báo cáo realtime' },
            { icon: <SwapOutlined style={{ color: 'var(--clr-accent-400)' }} />, label: 'Nhập / Xuất kho' },
            { icon: <WarningOutlined style={{ color: 'var(--clr-danger-400)' }} />, label: 'Cảnh báo hàng lỗi' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9999,
                padding: '6px 14px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            marginTop: 80,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 12,
            animation: 'fadeIn 800ms ease 400ms both',
          }}
        >
          © 2024 UMC — Đại học Kỹ Thuật - Công Nghệ Cần Thơ
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div
        style={{
          width: '45%',
          minWidth: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: '44px 40px',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
            animation: 'scaleIn 500ms cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              Đăng nhập
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              Nhập thông tin tài khoản để tiếp tục
            </p>
          </div>

          {/* Form */}
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="username"
              label={
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
                  Tên đăng nhập
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="Nhập tên đăng nhập"
                size="large"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
                  Mật khẩu
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="Nhập mật khẩu"
                size="large"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  background: loading
                    ? 'rgba(245,158,11,0.5)'
                    : 'linear-gradient(135deg, #D97706, #F59E0B)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  letterSpacing: '0.02em',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.4)',
                  transition: 'all 200ms ease',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = loading
                    ? 'none'
                    : '0 4px 20px rgba(245,158,11,0.4)';
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spinSlow 0.7s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRightOutlined style={{ fontSize: 14 }} />
                  </>
                )}
              </button>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* Responsive: hide left panel on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; min-width: 0 !important; padding: 24px !important; }
        }
        /* Fix dark inputs placeholder color */
        .login-input::placeholder { color: rgba(255,255,255,0.3) !important; }
        /* Fix ant input dark style on login */
        .ant-input-affix-wrapper.login-dark {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
      `}</style>
    </div>
  );
}
