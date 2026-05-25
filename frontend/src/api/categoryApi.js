// api/categoryApi.js
import axiosInstance from './axiosInstance';

export const getCategoriesApi = async (type) => {
  const params = type ? { type } : {};
  const res = await axiosInstance.get('/v1/categories', { params });
  return res.data.data; // mảng categories
};

export const createCategoryApi = async (data) => {
  const res = await axiosInstance.post('/v1/categories', data);
  return res.data.data;
};

export const updateCategoryApi = async (id, data) => {
  const res = await axiosInstance.put(`/v1/categories/${id}`, data);
  return res.data.data;
};

export const deleteCategoryApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/categories/${id}`);
  return res.data;
};
