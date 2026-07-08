import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import PrintLayout from './PrintLayout';

const ExportReceiptPrint = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const getRecipientName = () => {
    if (data.export_type === 'Xuất cho xưởng SX') {
      return data.Workshop?.workshop_name || '—';
    }
    if (data.export_type === 'Xuất bán') {
      return 'Khách mua hàng';
    }
    return 'Nhà cung cấp (Trả hàng)';
  };

  const getReason = () => {
    switch (data.export_type) {
      case 'Xuất cho xưởng SX':
        return 'Xuất nguyên vật liệu cho xưởng sản xuất';
      case 'Xuất bán':
        return 'Xuất kho bán hàng cho đối tác / khách hàng';
      case 'Xuất trả NCC':
        return 'Xuất trả lại linh kiện lỗi cho nhà cung cấp';
      default:
        return 'Xuất kho vật tư, thiết bị';
    }
  };

  return (
    <div ref={ref}>
      <PrintLayout
        title="PHIẾU XUẤT KHO"
        formNumber="02-VT"
        signatures={['Người lập phiếu', 'Người nhận hàng', 'Thủ kho', 'Kế toán trưởng', 'Giám đốc']}
      >
        {/* Info group in table/list details */}
        <div className="print-info-group">
          <div className="print-info-row">
            <strong>Số phiếu: </strong> {data.export_code}
          </div>
          <div className="print-info-row">
            <strong>Ngày xuất kho: </strong> {dayjs(data.export_date).format('DD/MM/YYYY HH:mm')}
          </div>
          <div className="print-info-row">
            <strong>Người nhận hàng: </strong> {getRecipientName()}
          </div>
          <div className="print-info-row">
            <strong>Xuất tại kho: </strong> {data.Warehouse?.warehouse_name || '—'} (Địa điểm:{' '}
            {data.Warehouse?.location || '—'})
          </div>
          <div className="print-info-row">
            <strong>Lý do xuất kho: </strong> {getReason()}
          </div>
          {data.note && (
            <div className="print-info-row">
              <strong>Ghi chú: </strong> {data.note}
            </div>
          )}
        </div>

        {/* Table of items */}
        <table>
          <thead>
            <tr>
              <th className="center-cell" style={{ width: '5%' }}>
                STT
              </th>
              <th style={{ width: '35%' }}>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, sản phẩm</th>
              <th style={{ width: '15%' }}>Mã số</th>
              <th className="center-cell" style={{ width: '10%' }}>
                Đơn vị
              </th>
              <th className="center-cell" style={{ width: '13%' }}>
                Số lượng (Yêu cầu)
              </th>
              <th className="center-cell" style={{ width: '12%' }}>
                Thực xuất
              </th>
              <th className="num-cell" style={{ width: '10%' }}>
                Đơn giá
              </th>
              <th className="num-cell" style={{ width: '10%' }}>
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {(data.ExportDetails || []).map((item, idx) => (
              <tr key={item.export_detail_id || idx}>
                <td className="center-cell">{idx + 1}</td>
                <td>{item.Product?.product_name || '—'}</td>
                <td>{item.Product?.product_code || '—'}</td>
                <td className="center-cell">{item.Product?.unit || '—'}</td>
                <td className="center-cell">{item.quantity?.toLocaleString('vi-VN')}</td>
                <td className="center-cell">{item.quantity?.toLocaleString('vi-VN')}</td>
                <td className="num-cell">—</td>
                <td className="num-cell">—</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr>
              <td colSpan="7" style={{ fontWeight: 'bold', textAlign: 'right' }}>
                Cộng:
              </td>
              <td className="num-cell" style={{ fontWeight: 'bold' }}>
                —
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total in words placeholder */}
        <div style={{ marginTop: 10, fontStyle: 'italic' }}>
          <strong>Tổng số tiền bằng chữ (nếu có): </strong>
          ..............................................................................................................
        </div>
      </PrintLayout>
    </div>
  );
});

ExportReceiptPrint.displayName = 'ExportReceiptPrint';
ExportReceiptPrint.propTypes = {
  data: PropTypes.object,
};

export default ExportReceiptPrint;
