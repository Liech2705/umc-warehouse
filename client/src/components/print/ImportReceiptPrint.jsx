import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import PrintLayout from './PrintLayout';

const ImportReceiptPrint = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const totalAmount = (data.ImportDetails || []).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const getDelivererName = () => {
    if (data.import_type === 'Từ NCC') {
      return data.Supplier?.supplier_name || '—';
    }
    return data.Workshop?.workshop_name || '—';
  };

  const getReason = () => {
    switch (data.import_type) {
      case 'Từ NCC':
        return 'Nhập mua hàng từ nhà cung cấp';
      case 'Từ xưởng':
        return 'Nhập thành phẩm sản xuất từ xưởng';
      case 'Xưởng trả lại':
        return 'Nhập trả lại linh kiện từ xưởng';
      default:
        return 'Nhập kho vật tư, thiết bị';
    }
  };

  return (
    <div ref={ref}>
      <PrintLayout
        title="PHIẾU NHẬP KHO"
        formNumber="01-VT"
        signatures={['Người lập phiếu', 'Người giao hàng', 'Thủ kho', 'Kế toán trưởng']}
      >
        {/* Info group in table/list details */}
        <div className="print-info-group">
          <div className="print-info-row">
            <strong>Số phiếu: </strong> {data.import_code}
          </div>
          <div className="print-info-row">
            <strong>Ngày lập phiếu: </strong> {dayjs(data.import_date).format('DD/MM/YYYY HH:mm')}
          </div>
          <div className="print-info-row">
            <strong>Người giao hàng: </strong> {getDelivererName()}
          </div>
          <div className="print-info-row">
            <strong>Nhập vào kho: </strong> {data.Warehouse?.warehouse_name || '—'} (Địa điểm:{' '}
            {data.Warehouse?.location || '—'})
          </div>
          <div className="print-info-row">
            <strong>Lý do nhập kho: </strong> {getReason()}
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
              <th style={{ width: '30%' }}>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, sản phẩm</th>
              <th style={{ width: '12%' }}>Mã số</th>
              <th className="center-cell" style={{ width: '10%' }}>
                Đơn vị
              </th>
              <th className="center-cell" style={{ width: '13%' }}>
                Số lượng (Chứng từ)
              </th>
              <th className="center-cell" style={{ width: '10%' }}>
                Thực nhập
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
            {(data.ImportDetails || []).map((item, idx) => (
              <tr key={item.import_detail_id || idx}>
                <td className="center-cell">{idx + 1}</td>
                <td>{item.Product?.product_name || '—'}</td>
                <td>{item.Product?.product_code || '—'}</td>
                <td className="center-cell">{item.Product?.unit || '—'}</td>
                <td className="center-cell">{item.quantity?.toLocaleString('vi-VN')}</td>
                <td className="center-cell">{item.quantity?.toLocaleString('vi-VN')}</td>
                <td className="num-cell">
                  {parseInt(item.unit_price || 0, 10).toLocaleString('vi-VN')} đ
                </td>
                <td className="num-cell">
                  {parseInt(item.quantity * item.unit_price, 10).toLocaleString('vi-VN')} đ
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr>
              <td colSpan="7" style={{ fontWeight: 'bold', textAlign: 'right' }}>
                Cộng:
              </td>
              <td className="num-cell" style={{ fontWeight: 'bold' }}>
                {parseInt(totalAmount, 10).toLocaleString('vi-VN')} đ
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total in words */}
        <div style={{ marginTop: 10, fontStyle: 'italic' }}>
          <strong>Tổng số tiền bằng chữ: </strong>
          {numberToVietnameseWords(totalAmount)}
        </div>
      </PrintLayout>
    </div>
  );
});

// Helper for Vietnamese numbers to words
function numberToVietnameseWords(num) {
  if (!num || num === 0) return '................................................';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(group) {
    let read = '';
    const hundreds = Math.floor(group / 100);
    const tens = Math.floor((group % 100) / 10);
    const ones = group % 10;

    if (hundreds > 0) {
      read += digits[hundreds] + ' trăm ';
    }

    if (tens > 1) {
      read += digits[tens] + ' mươi ';
    } else if (tens === 1) {
      read += 'mười ';
    } else if (hundreds > 0 && ones > 0) {
      read += 'lẻ ';
    }

    if (ones > 0) {
      if (ones === 1 && tens > 1) {
        read += 'mốt';
      } else if (ones === 5 && tens > 0) {
        read += 'lăm';
      } else {
        read += digits[ones];
      }
    }
    return read.trim();
  }

  let str = '';
  let i = 0;
  let remaining = num;
  while (remaining > 0) {
    const group = remaining % 1000;
    if (group > 0) {
      const groupStr = readGroup(group);
      str = groupStr + ' ' + units[i] + ' ' + str;
    }
    remaining = Math.floor(remaining / 1000);
    i++;
  }

  str = str.trim();
  return str.charAt(0).toUpperCase() + str.slice(1) + ' đồng chẵn./.';
}

ImportReceiptPrint.displayName = 'ImportReceiptPrint';
ImportReceiptPrint.propTypes = {
  data: PropTypes.object,
};

export default ImportReceiptPrint;
