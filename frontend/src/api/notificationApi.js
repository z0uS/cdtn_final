// api/notificationApi.js
import axiosInstance from './axiosInstance';

export const getNotificationsApi = async (params = {}) => {
  const res = await axiosInstance.get('/v1/notifications', { params });
  // Backend: success(res, { data: rows, pagination }) → res.data.data.data = rows
  return res.data.data?.data ?? res.data.data ?? [];
};

export const getUnreadCountApi = async () => {
  const res = await axiosInstance.get('/v1/notifications/unread-count');
  return res.data.data.unread_count;
};

export const markAsReadApi = async (id) => {
  const res = await axiosInstance.put(`/v1/notifications/${id}/read`);
  return res.data;
};

export const markAllAsReadApi = async () => {
  const res = await axiosInstance.put('/v1/notifications/read-all');
  return res.data;
};
