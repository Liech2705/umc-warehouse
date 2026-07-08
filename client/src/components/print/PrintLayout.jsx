import React from 'react';
import PropTypes from 'prop-types';

export default function PrintLayout({
  children,
  companyName = 'CÔNG TY TNHH ĐIỆN TỬ UMC VIỆT NAM',
  companyAddress = 'Khu công nghiệp Tân Trường, Huyện Cẩm Giàng, Tỉnh Hải Dương, Việt Nam',
  title = 'CHỨNG TỪ KHO',
  formNumber = '01-VT',
  signatures = ['Người lập phiếu', 'Thủ kho', 'Kế toán trưởng', 'Giám đốc'],
  signerNames = [],
}) {
  return (
    <div className="print-document">
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          <div className="print-company-name">{companyName}</div>
          <div className="print-company-address">Địa chỉ: {companyAddress}</div>
        </div>
        <div className="print-header-right">
          <div className="print-form-number">Mẫu số: {formNumber}</div>
          <div className="print-form-law">(Ban hành theo Thông tư 133/2016/TT-BTC)</div>
        </div>
      </div>

      {/* Title */}
      <div className="print-title-container">
        <h2 className="print-title-text">{title}</h2>
        <div className="print-date-sub">Ngày ..... tháng ..... năm 20...</div>
      </div>

      {/* Content */}
      <div className="print-content">{children}</div>

      {/* Signatures */}
      <div className="print-signatures">
        {signatures.map((role, idx) => (
          <div key={idx} className="print-signature-col">
            <div className="print-signature-role">{role}</div>
            <div className="print-signature-sub">(Ký, họ tên)</div>
            <div className="print-signature-space"></div>
            {signerNames[idx] && (
              <div
                className="print-signature-name"
                style={{ fontWeight: 'bold', fontSize: '12px' }}
              >
                {signerNames[idx]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

PrintLayout.propTypes = {
  children: PropTypes.node,
  companyName: PropTypes.string,
  companyAddress: PropTypes.string,
  title: PropTypes.string,
  formNumber: PropTypes.string,
  signatures: PropTypes.arrayOf(PropTypes.string),
  signerNames: PropTypes.arrayOf(PropTypes.string),
};
