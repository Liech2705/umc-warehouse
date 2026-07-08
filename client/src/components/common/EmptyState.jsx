import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * EmptyState - hiển thị khi table/list không có dữ liệu
 *
 * Usage:
 *   <EmptyState
 *     title="Chưa có danh mục nào"
 *     description="Thêm danh mục đầu tiên để bắt đầu phân loại sản phẩm."
 *     actionText="Thêm danh mục"
 *     onAction={() => openModal()}
 *   />
 *
 * Dùng với antd Table:
 *   <Table locale={{ emptyText: <EmptyState ... /> }} ... />
 */
export default function EmptyState({ title, description, actionText, onAction }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} imageStyle={{ height: 60 }} description={null} />
      <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginTop: 8 }}>{title}</div>
      {description && (
        <div
          style={{
            fontSize: 13,
            color: '#9ca3af',
            marginTop: 6,
            maxWidth: 360,
            margin: '6px auto 0',
          }}
        >
          {description}
        </div>
      )}
      {actionText && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction} style={{ marginTop: 18 }}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
