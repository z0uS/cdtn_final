// utils/formatCurrency.js
// Định dạng tiền tệ VND và các loại khác

/**
 * Định dạng số thành chuỗi tiền tệ VND
 * @param {number} amount
 * @param {boolean} compact - rút gọn (1.2M, 500K)
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined) return '0 ₫';
  const num = Number(amount);
  if (isNaN(num)) return '0 ₫';

  if (compact) {
    if (Math.abs(num) >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' Tỷ';
    }
    if (Math.abs(num) >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.0', '') + ' Triệu';
    }
    if (Math.abs(num) >= 1_000) {
      return (num / 1_000).toFixed(0) + 'K';
    }
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Parse chuỗi số có dấu phân cách thành số
 * @param {string} value
 */
export const parseCurrencyInput = (value) => {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d]/g, '')) || 0;
};

/**
 * Format input tiền tệ khi gõ (thêm dấu chấm tự động)
 * @param {string} value
 */
export const formatCurrencyInput = (value) => {
  const num = parseCurrencyInput(value);
  if (!num) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
};
