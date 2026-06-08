// api/budgetApi.js
import axiosInstance from './axiosInstance';

export const getBudgetsApi = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year)  params.year  = year;
  const res = await axiosInstance.get('/v1/budgets', { params });
  return res.data.data;
};

export const createBudgetApi = async (data) => {
  const res = await axiosInstance.post('/v1/budgets', data);
  return res.data.data;
};

export const updateBudgetApi = async (id, data) => {
  const res = await axiosInstance.put(`/v1/budgets/${id}`, data);
  return res.data.data;
};

export const deleteBudgetApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/budgets/${id}`);
  return res.data;
};
