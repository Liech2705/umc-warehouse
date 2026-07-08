const ExcelJS = require('exceljs');

/**
 * Xuất dữ liệu ra file Excel và ghi trực tiếp vào response stream.
 * @param {Response} res Express response object
 * @param {Object} options Cấu hình xuất Excel
 * @param {string} options.sheetName Tên của sheet
 * @param {Array<{header: string, key: string, width?: number}>} options.columns Định nghĩa các cột
 * @param {Array<Object>} options.data Mảng dữ liệu tương ứng với key của cột
 */
exports.exportToExcel = async (res, { sheetName, columns, data }) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Cấu hình các cột
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 18,
    }));

    // Định dạng tiêu đề cột (Header Row)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A5F' }, // UMC Blue
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'medium', color: { argb: '1E3A5F' } },
        bottom: { style: 'medium', color: { argb: '1E3A5F' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } },
      };
    });

    // Thêm các dòng dữ liệu
    worksheet.addRows(data);

    // Định dạng các dòng dữ liệu (Data Rows)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // Bỏ qua dòng tiêu đề
      if (rowNumber === 1) return;

      row.height = 24;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          name: 'Segoe UI',
          size: 10,
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } },
        };
      });
    });

    // Thiết lập response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(sheetName)}.xlsx`
    );

    // Ghi file trực tiếp vào response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo file Excel: ' + error.message,
      });
    }
  }
};
