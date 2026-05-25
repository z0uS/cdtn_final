// store/uiStore.js
// Zustand store cho UI state: sidebar, dark mode, modal...

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen:    true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Dark mode
      darkMode:      false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode:   (val) => set({ darkMode: val }),

      // Modal thêm giao dịch nhanh
      quickAddOpen:    false,
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
    }),
    {
      name: 'cdtn-ui',
      partialize: (s) => ({ darkMode: s.darkMode }),
    },
  ),
);

export default useUIStore;
