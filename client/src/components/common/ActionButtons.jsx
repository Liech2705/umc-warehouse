/**
 * ActionButtons - icon-only Edit + Delete with Tooltip + Popconfirm
 * Usage:
 *   <ActionButtons
 *     onEdit={() => handleOpenEditModal(record)}
 *     onDelete={() => deleteMutation.mutate(record.id)}
 *     canEdit={canModify}
 *     canDelete={canDelete}
 *     deleteTitle="Xóa nhóm hàng này?"
 *     deleteDescription="Chỉ xóa được khi không có sản phẩm nào thuộc nhóm hàng này."
 *   />
 */
import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function ActionButtons({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  deleteTitle = 'Bạn có chắc chắn muốn xóa?',
  deleteDescription,
}) {
  return (
    <Space size={4}>
      <Tooltip title="Sửa">
        <Button
          type="text"
          icon={<EditOutlined />}
          disabled={!canEdit}
          onClick={onEdit}
          style={{ color: canEdit ? 'var(--text-link)' : undefined }}
        />
      </Tooltip>
      <Popconfirm
        title={deleteTitle}
        description={deleteDescription}
        okText="Xóa"
        cancelText="Hủy"
        disabled={!canDelete}
        onConfirm={onDelete}
      >
        <Tooltip title="Xóa">
          <Button type="text" danger icon={<DeleteOutlined />} disabled={!canDelete} />
        </Tooltip>
      </Popconfirm>
    </Space>
  );
}
