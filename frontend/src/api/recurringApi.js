// api/recurringApi.js
import axiosInstance from './axiosInstance';

// Lấy danh sách giao dịch định kỳ
export const getRecurringApi = async () => {
  const res = await axiosInstance.get('/v1/recurring');
  return res.data.data;
};

// Tạo giao dịch định kỳ mới
export const createRecurringApi = async (data) => {
  const res = await axiosInstance.post('/v1/recurring', data);
  return res.data.data;
};

// Cập nhật giao dịch định kỳ
export const updateRecurringApi = async (id, data) => {
  const res = await axiosInstance.put(`/v1/recurring/${id}`, data);
  return res.data.data;
};

// Bật/tắt kích hoạt giao dịch định kỳ
export const toggleRecurringApi = async (id) => {
  const res = await axiosInstance.put(`/v1/recurring/${id}/toggle`);
  return res.data.data;
};

// Xóa giao dịch định kỳ
export const deleteRecurringApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/recurring/${id}`);
  return res.data;
};
