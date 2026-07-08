import { Result, Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '85vh',
        padding: '16px',
      }}
    >
      <Card
        bordered={false}
        style={{
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          borderRadius: 12,
        }}
      >
        <Result
          status="404"
          title="404"
          subTitle="Xin lỗi, trang bạn đang truy cập không tồn tại hoặc đã bị di chuyển."
          extra={
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              Quay lại Trang chủ
            </Button>
          }
        />
      </Card>
    </div>
  );
}
