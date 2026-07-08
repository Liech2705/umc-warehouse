import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import PrintLayout from './PrintLayout';

const ScrapReceiptPrint = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const scrapId = data.ScrapReceipt?.scrap_id;
  const scrapCode = scrapId ? `BBH-${String(scrapId).padStart(5, '0')}` : 'BBH-XXXXX';
  const scrapDate = data.ScrapReceipt?.scrap_date || new Date();

  const getSourceTypeDesc = (type) => {
    if (type === 'Lỗi khi nhập') return 'Phát hiện khi nhập kho';
    if (type === 'Xưởng trả lỗi') return 'Xưởng trả về';
    return 'Tồn kho lâu ngày';
  };

  const approverName = data.ScrapReceipt?.approver?.full_name || '—';
  const reporterName = data.reporter?.full_name || '—';

  return (
    <div ref={ref}>
      <PrintLayout
        title="BIÊN BẢN HỦY HÀNG LỖI/HỎNG"
        formNumber="Mẫu tự thiết kế nội bộ"
        signatures={['Người báo cáo', 'Thủ kho', 'Người phê duyệt', 'Kế toán trưởng']}
        signerNames={[reporterName, '', approverName, '']}
      >
        {/* Info group in table/list details */}
        <div className="print-info-group">
          <div className="print-info-row">
            <strong>Số biên bản hủy: </strong> {scrapCode}
          </div>
          <div className="print-info-row">
            <strong>Ngày lập biên bản: </strong> {dayjs(scrapDate).format('DD/MM/YYYY HH:mm')}
          </div>
          <div className="print-info-row">
            <strong>Kho phát sinh hàng lỗi: </strong> {data.Warehouse?.warehouse_name || '—'}
          </div>
          <div className="print-info-row">
            <strong>Nguồn gốc lỗi: </strong> {getSourceTypeDesc(data.source_type)}
          </div>
          {data.source_type === 'Xưởng trả lỗi' && data.Workshop && (
            <div className="print-info-row">
              <strong>Xưởng liên quan: </strong> {data.Workshop.workshop_name}
            </div>
          )}
          <div className="print-info-row">
            <strong>Người báo cáo hỏng: </strong> {reporterName}
          </div>
          <div className="print-info-row">
            <strong>Người phê duyệt hủy: </strong> {approverName}
          </div>
        </div>

        {/* Table of items */}
        <table>
          <thead>
            <tr>
              <th className="center-cell" style={{ width: '8%' }}>
                STT
              </th>
              <th style={{ width: '37%' }}>Tên, nhãn hiệu, quy cách sản phẩm</th>
              <th style={{ width: '15%' }}>Mã sản phẩm</th>
              <th className="center-cell" style={{ width: '10%' }}>
                ĐVT
              </th>
              <th className="center-cell" style={{ width: '12%' }}>
                Số lượng hủy
              </th>
              <th style={{ width: '18%' }}>Lý do hư hỏng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="center-cell">1</td>
              <td>{data.Product?.product_name || '—'}</td>
              <td>{data.Product?.product_code || '—'}</td>
              <td className="center-cell">{data.Product?.unit || '—'}</td>
              <td className="center-cell" style={{ fontWeight: 'bold' }}>
                {data.quantity?.toLocaleString('vi-VN')}
              </td>
              <td>{data.reason || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Conclusion */}
        <div style={{ marginTop: 15, marginBottom: 15 }}>
          <strong>Kết luận: </strong> Hội đồng thống nhất hủy bỏ số hàng hóa nêu trên do không còn
          khả năng sử dụng/lưu kho.
        </div>

        {/* Custom signatures text overrides */}
        <div style={{ display: 'none' }}>
          {/* Custom signer names could be injected here if supported, otherwise read in custom render */}
        </div>
      </PrintLayout>
    </div>
  );
});

ScrapReceiptPrint.displayName = 'ScrapReceiptPrint';
ScrapReceiptPrint.propTypes = {
  data: PropTypes.object,
};

export default ScrapReceiptPrint;
