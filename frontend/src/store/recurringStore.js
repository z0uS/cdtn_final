// store/recurringStore.js
// Zustand store quản lý giao dịch định kỳ

import { create } from 'zustand';
import {
  getRecurringApi,
  createRecurringApi,
  updateRecurringApi,
  toggleRecurringApi,
  deleteRecurringApi,
} from '../api/recurringApi';

const useRecurringStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────
  recurringList: [],
  isLoading: false,
  error: null,

  // ── FETCH ───────────────────────────────────────────────
  fetchRecurring: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getRecurringApi();
      set({ recurringList: data || [] });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── CREATE ──────────────────────────────────────────────
  addRecurring: async (payload) => {
    const data = await createRecurringApi(payload);
    await get().fetchRecurring();
    return data;
  },

  // ── UPDATE ──────────────────────────────────────────────
  updateRecurring: async (id, payload) => {
    const data = await updateRecurringApi(id, payload);
    await get().fetchRecurring();
    return data;
  },

  // ── TOGGLE ──────────────────────────────────────────────
  toggleRecurring: async (id) => {
    const data = await toggleRecurringApi(id);
    // Cập nhật optimistic trực tiếp trong list
    set((state) => ({
      recurringList: state.recurringList.map((r) =>
        r.id === id ? { ...r, is_active: data?.is_active } : r,
      ),
    }));
    return data;
  },

  // ── DELETE ──────────────────────────────────────────────
  deleteRecurring: async (id) => {
    await deleteRecurringApi(id);
    set((state) => ({
      recurringList: state.recurringList.filter((r) => r.id !== id),
    }));
  },
}));

export default useRecurringStore;
