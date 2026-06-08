// src/utils/pagination.js
// Helper tính toán phân trang

/**
 * Tính offset và limit từ query params
 * @param {number|string} page  - Trang hiện tại (mặc định 1)
 * @param {number|string} limit - Số item mỗi trang (mặc định 20)
 * @returns {{ page, limit, offset }}
 */
export const getPagination = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;
  // Trả về integers để MySQL2 prepared statements không bị ER_WRONG_ARGUMENTS
  return { page: p, limit: l, offset: offset };
};

/**
 * Tạo object pagination trả về client
 * @param {number} total  - Tổng số records
 * @param {number} page   - Trang hiện tại
 * @param {number} limit  - Số item mỗi trang
 */
export const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
