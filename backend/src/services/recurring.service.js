// src/services/recurring.service.js
// Logic tính next_date và tạo giao dịch định kỳ

import { calcNextDate } from '../utils/dateHelper.js';

export { calcNextDate };

/**
 * Kiểm tra xem một recurring transaction có cần được xử lý hôm nay không
 * @param {string} nextDate - YYYY-MM-DD
 */
export const isDue = (nextDate) => {
  const today = new Date().toISOString().split('T')[0];
  return nextDate <= today;
};
