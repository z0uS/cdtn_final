// api/authApi.js
// Gọi API backend thật (Node.js/Express)

import axiosInstance from './axiosInstance';

// ── Đăng nhập ────────────────────────────────────────────────
export const loginApi = async ({ email, password }) => {
  const res = await axiosInstance.post('/v1/auth/login', { email, password });
  // Backend trả: { success, data: { user, accessToken, refreshToken } }
  const { user, accessToken, refreshToken } = res.data.data;
  // Lưu refreshToken vào localStorage để dùng sau
  localStorage.setItem('cdtn-refresh-token', refreshToken);
  // Map full_name → name để tương thích với frontend
  return { user: mapUser(user), token: accessToken };
};

// ── Đăng ký ──────────────────────────────────────────────────
export const registerApi = async ({ name, email, password }) => {
  const res = await axiosInstance.post('/v1/auth/register', {
    full_name: name,
    email,
    password,
  });
  const { user, accessToken, refreshToken } = res.data.data;
  localStorage.setItem('cdtn-refresh-token', refreshToken);
  return { user: mapUser(user), token: accessToken };
};

// ── Quên mật khẩu ────────────────────────────────────────────
export const forgotPasswordApi = async ({ email, newPassword }) => {
  const res = await axiosInstance.post('/v1/auth/forgot-password', { email, newPassword });
  return res.data;
};

// ── Đổi mật khẩu ─────────────────────────────────────────────
export const changePasswordApi = async ({ oldPassword, newPassword }) => {
  const res = await axiosInstance.put('/v1/users/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.data;
};

// ── Lấy thông tin user hiện tại ──────────────────────────────
export const getMeApi = async () => {
  const res = await axiosInstance.get('/v1/users/profile');
  return mapUser(res.data.data);
};

// ── Cập nhật profile ─────────────────────────────────────────
export const updateProfileApi = async (data) => {
  const res = await axiosInstance.put('/v1/users/profile', data);
  return mapUser(res.data.data);
};

// ── Upload Avatar ────────────────────────────────────────────
export const uploadAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await axiosInstance.post('/v1/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // Trả về URL avatar
  return res.data.data.avatar_url;
};

// ── Helper: Map user từ backend format sang frontend format ──
const mapUser = (user) => ({
  id:        user.id,
  name:      user.full_name,      // frontend dùng `name`
  full_name: user.full_name,
  email:     user.email,
  avatar:    user.avatar_url,     // frontend dùng `avatar`
  avatar_url: user.avatar_url,
  currency:  user.currency || 'VND',
  theme:     user.theme    || 'light',
  createdAt: user.created_at,
});
