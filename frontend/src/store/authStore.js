// store/authStore.js
// Zustand store quản lý xác thực người dùng

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      // Đăng nhập – lưu token và thông tin user
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      // Đăng xuất – xóa toàn bộ state
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Cập nhật thông tin user
      updateUser: (data) => {
        set((state) => ({ user: { ...state.user, ...data } }));
      },
    }),
    {
      name: 'cdtn-auth', // key trong localStorage
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
