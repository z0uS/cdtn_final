// components/layout/MainLayout.jsx
// Layout chính: Sidebar + Navbar + main content area

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';
import useUIStore from '../../store/uiStore';
import useTransactionStore from '../../store/transactionStore';
import TransactionModal from '../transaction/TransactionModal';
import { Plus } from 'lucide-react';

const MainLayout = () => {
  const { sidebarOpen, darkMode, quickAddOpen, setQuickAddOpen } = useUIStore();
  const fetchAllData = useTransactionStore((s) => s.fetchAllData);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 transition-colors duration-300">
        {/* Sidebar */}
        <Sidebar />

        {/* Main area – offset by sidebar width */}
        <div
          className="transition-all duration-300"
          style={{
            paddingLeft: sidebarOpen ? 'var(--sidebar-width)' : '70px',
          }}
        >
          {/* Sticky Navbar */}
          <Navbar />

          {/* Page content */}
          <main
            className="min-h-screen pt-[var(--navbar-height)] px-4 sm:px-6 py-6"
          >
            {/* Navbar left offset */}
            <style>{`
              header {
                left: ${sidebarOpen ? 'var(--sidebar-width)' : '70px'} !important;
              }
            `}</style>

            <div className="max-w-7xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>

        {/* FAB Thêm giao dịch nhanh */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title="Thêm giao dịch nhanh"
        >
          <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        </button>

        {/* Quick Add Modal */}
        <TransactionModal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
        />
      </div>
    </div>
  );
};

export default MainLayout;
