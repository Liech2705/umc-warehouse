/**
 * formatCurrency.js — Hàm format tiền tệ VNĐ chuẩn dùng chung toàn hệ thống
 * Sử dụng Intl.NumberFormat để đảm bảo đúng chuẩn locale vi-VN
 */

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

/**
 * Format số thành chuỗi tiền tệ VNĐ đầy đủ
 * @example formatCurrency(125000000) → "125.000.000 ₫"
 */
export const formatCurrency = (value) => vndFormatter.format(Number(value) || 0);

/**
 * Format số thành chuỗi tiền tệ rút gọn cho StatCard / dashboard
 * @example formatCurrencyCompact(125000000)  → "125,0 triệu ₫"
 * @example formatCurrencyCompact(2500000000) → "2,5 tỷ ₫"
 */
export const formatCurrencyCompact = (value) => {
  const v = Number(value) || 0;
  if (v >= 1_000_000_000) {
    return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ ₫`;
  }
  if (v >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(1).replace('.', ',')} triệu ₫`;
  }
  return vndFormatter.format(v);
};
