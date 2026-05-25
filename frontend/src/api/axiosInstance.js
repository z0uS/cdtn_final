// api/axiosInstance.js
// Axios instance với JWT interceptor

import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: gắn Bearer token ─────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('cdtn-auth');
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch (_) { }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: xử lý lỗi toàn cục ────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token hết hạn → xóa auth state và về trang login
      localStorage.removeItem('cdtn-auth');
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('Bạn không có quyền thực hiện hành động này.');
    } else if (status === 404) {
      toast.error('Không tìm thấy dữ liệu yêu cầu.');
    } else if (status >= 500) {
      toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
    } else if (!error.response) {
      toast.error('Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.');
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
