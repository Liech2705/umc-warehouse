import { Space } from 'antd';

export default function PageHeader({ title, extra }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1E3A5F' }}>{title}</h2>
      {extra && <Space>{extra}</Space>}
    </div>
  );
}
