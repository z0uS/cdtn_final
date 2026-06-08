// api/transactionApi.js
import axiosInstance from './axiosInstance';

// Lấy danh sách giao dịch (có filter, phân trang)
export const getTransactionsApi = async (params = {}) => {
  const res = await axiosInstance.get('/v1/transactions', { params });
  return res.data; // { success, data: [], pagination: {} }
};

// Tạo giao dịch mới
export const createTransactionApi = async (data) => {
  const res = await axiosInstance.post('/v1/transactions', data);
  return res.data.data;
};

// Cập nhật giao dịch
export const updateTransactionApi = async (id, data) => {
  const res = await axiosInstance.put(`/v1/transactions/${id}`, data);
  return res.data.data;
};

// Xóa giao dịch
export const deleteTransactionApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/transactions/${id}`);
  return res.data;
};

// Chi tiết giao dịch
export const getTransactionByIdApi = async (id) => {
  const res = await axiosInstance.get(`/v1/transactions/${id}`);
  return res.data.data;
};
