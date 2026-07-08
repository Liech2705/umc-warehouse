import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

/**
 * PrintButton - Nút bấm in phiếu chuẩn Antd tự động ẩn khi in tài liệu
 *
 * @param {Function} onClick - Hàm xử lý sự kiện click
 * @param {String} type - Loại nút bấm của Antd (default = 'default')
 * @param {String} size - Kích thước nút bấm (default = 'middle')
 */
export default function PrintButton({ onClick, type = 'default', size = 'middle', ...props }) {
  return (
    <Button
      type={type}
      size={size}
      icon={<PrinterOutlined />}
      onClick={onClick}
      className="no-print"
      {...props}
    >
      In phiếu
    </Button>
  );
}

PrintButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  type: PropTypes.string,
  size: PropTypes.string,
};
