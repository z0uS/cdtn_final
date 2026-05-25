// api/transferApi.js
import axiosInstance from './axiosInstance';

export const createTransferApi = async (data) => {
  const res = await axiosInstance.post('/v1/transfers', data);
  return res.data;
};

export const getTransfersApi = async (params = {}) => {
  const res = await axiosInstance.get('/v1/transfers', { params });
  return res.data;
};
