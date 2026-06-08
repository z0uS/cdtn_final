// api/accountApi.js
// API calls cho tài khoản/ví

import axiosInstance from './axiosInstance';

// Lấy danh sách tất cả tài khoản
export const getAccountsApi = async () => {
  const res = await axiosInstance.get('/v1/accounts');
  return res.data.data; // { accounts: [], total_balance: number }
};

// Tạo tài khoản mới
export const createAccountApi = async (data) => {
  const res = await axiosInstance.post('/v1/accounts', data);
  return res.data.data;
};

// Cập nhật tài khoản
export const updateAccountApi = async (id, data) => {
  const res = await axiosInstance.put(`/v1/accounts/${id}`, data);
  return res.data.data;
};

// Xóa tài khoản
export const deleteAccountApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/accounts/${id}`);
  return res.data;
};

// Đặt làm tài khoản mặc định
export const setDefaultAccountApi = async (id) => {
  const res = await axiosInstance.put(`/v1/accounts/${id}/set-default`);
  return res.data;
};
