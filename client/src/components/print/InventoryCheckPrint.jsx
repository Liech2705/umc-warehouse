import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import PrintLayout from './PrintLayout';

const InventoryCheckPrint = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const checkCode = `PKK-${String(data.check_id).padStart(5, '0')}`;
  const details = data.InventoryCheckDetails || [];

  const totalItems = details.length;
  const totalDiscrepancies = details.filter(
    (item) => item.actual_quantity !== item.system_quantity
  ).length;

  return (
    <div ref={ref}>
      <PrintLayout
        title="BIÊN BẢN KIỂM KÊ KHO"
        formNumber="05-VT"
        signatures={['Trưởng ban kiểm kê', 'Thủ kho', 'Kế toán trưởng', 'Giám đốc']}
      >
        {/* Info group in table/list details */}
        <div className="print-info-group">
          <div className="print-info-row">
            <strong>Số biên bản: </strong> {checkCode}
          </div>
          <div className="print-info-row">
            <strong>Thời điểm kiểm kê: </strong> {dayjs(data.check_date).format('DD/MM/YYYY HH:mm')}
          </div>
          <div className="print-info-row">
            <strong>Kho kiểm kê: </strong> {data.Warehouse?.warehouse_name || '—'} (Địa điểm:{' '}
            {data.Warehouse?.location || '—'})
          </div>
          <div className="print-info-row">
            <strong>Trưởng ban kiểm kê (Ông/Bà): </strong> {data.User?.full_name || '—'}
          </div>
          <div className="print-info-row">
            <strong>Ban kiểm kê gồm các thành viên khác: </strong> Thủ kho, đại diện Kế toán và Giám
            đốc.
          </div>
        </div>

        {/* Table of items */}
        <table>
          <thead>
            <tr>
              <th className="center-cell" style={{ width: '5%' }}>
                STT
              </th>
              <th style={{ width: '25%' }}>Tên sản phẩm/linh kiện</th>
              <th className="center-cell" style={{ width: '8%' }}>
                ĐVT
              </th>
              <th className="center-cell" style={{ width: '13%' }}>
                Số lượng sổ sách
              </th>
              <th className="center-cell" style={{ width: '13%' }}>
                Số lượng thực tế
              </th>
              <th className="center-cell" style={{ width: '12%' }}>
                Chênh lệch
              </th>
              <th style={{ width: '12%' }}>Nguyên nhân</th>
              <th style={{ width: '12%' }}>Đề xuất xử lý</th>
            </tr>
          </thead>
          <tbody>
            {details.map((item, idx) => {
              const diff = item.actual_quantity - item.system_quantity;
              let diffText = '0';
              if (diff > 0) diffText = `+${diff}`;
              else if (diff < 0) diffText = `(${Math.abs(diff)})`;

              return (
                <tr key={item.check_detail_id || idx}>
                  <td className="center-cell">{idx + 1}</td>
                  <td>{item.Product?.product_name || '—'}</td>
                  <td className="center-cell">{item.Product?.unit || '—'}</td>
                  <td className="center-cell">{item.system_quantity?.toLocaleString('vi-VN')}</td>
                  <td className="center-cell">{item.actual_quantity?.toLocaleString('vi-VN')}</td>
                  <td
                    className="center-cell"
                    style={{ fontWeight: diff !== 0 ? 'bold' : 'normal' }}
                  >
                    {diffText}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary text */}
        <div style={{ marginTop: 10 }}>
          <div className="print-info-row">
            - Tổng số mặt hàng kiểm kê: <strong>{totalItems}</strong> mặt hàng.
          </div>
          <div className="print-info-row">
            - Số mặt hàng có chênh lệch giữa thực tế và sổ sách:{' '}
            <strong>{totalDiscrepancies}</strong> mặt hàng.
          </div>
          <div className="print-info-row" style={{ marginTop: 8, fontStyle: 'italic' }}>
            Kết luận của ban kiểm kê: Biên bản được lập thành 02 bản, các thành viên thống nhất số
            liệu và đề xuất phương án xử lý chênh lệch như trên.
          </div>
        </div>
      </PrintLayout>
    </div>
  );
});

InventoryCheckPrint.displayName = 'InventoryCheckPrint';
InventoryCheckPrint.propTypes = {
  data: PropTypes.object,
};

export default InventoryCheckPrint;
