// src/utils/dateHelper.js
// Tiện ích xử lý ngày tháng

/**
 * Lấy tháng và năm hiện tại
 */
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  };
};

/**
 * Format ngày sang YYYY-MM-DD
 * @param {Date|string} date
 */
export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Tính next_date cho giao dịch định kỳ
 * @param {Date|string} currentDate
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency
 * @returns {string} YYYY-MM-DD
 */
export const calcNextDate = (currentDate, frequency) => {
  const d = new Date(currentDate);
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1);       break;
    case 'weekly':  d.setDate(d.getDate() + 7);       break;
    case 'monthly': d.setMonth(d.getMonth() + 1);     break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    default:        d.setMonth(d.getMonth() + 1);
  }
  return formatDate(d);
};

/**
 * Kiểm tra tháng/năm hợp lệ
 */
export const validateMonthYear = (month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);
  if (isNaN(m) || m < 1 || m > 12) return false;
  if (isNaN(y) || y < 2000 || y > 2100) return false;
  return true;
};
