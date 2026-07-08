import { Table, Skeleton } from 'antd';
import EmptyState from './EmptyState';

/**
 * DataTable - wrapper quanh antd Table với cấu hình thống nhất toàn hệ thống
 *
 * Usage:
 *   <DataTable
 *     dataSource={categories}
 *     columns={columns}
 *     rowKey="category_id"
 *     loading={isLoading}
 *   />
 *
 *   // Override pagination nếu cần
 *   <DataTable ... pagination={{ pageSize: 5 }} />
 *
 *   // Tắt empty state mặc định
 *   <DataTable ... emptyTitle={null} />
 *
 * Tất cả các props còn lại được pass thẳng xuống antd Table.
 */
export default function DataTable({
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  pagination,
  rowKey,
  loading,
  ...tableProps
}) {
  if (loading) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const defaultPagination = {
    defaultPageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} bản ghi`,
    style: { marginTop: 16 },
    ...pagination,
  };

  return (
    <Table
      rowKey={rowKey}
      size="middle"
      bordered={false}
      scroll={{ x: 'max-content' }}
      pagination={defaultPagination}
      rowClassName={(_, index) => (index % 2 === 1 ? 'data-table-row-alt' : '')}
      locale={{
        emptyText: emptyTitle ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionText={emptyActionText}
            onAction={onEmptyAction}
          />
        ) : undefined,
      }}
      {...tableProps}
    />
  );
}
