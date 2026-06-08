// src/utils/response.js
// Helper chuẩn hóa JSON response cho toàn bộ API

/**
 * Trả về response thành công
 */
export const success = (res, data = null, message = 'Thành công', status = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

/**
 * Trả về response thành công với phân trang
 */
export const paginated = (res, data, pagination, message = 'Thành công') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Trả về response lỗi
 */
export const error = (res, message = 'Đã xảy ra lỗi', status = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

export default { success, paginated, error };
