// components/layout/Navbar.jsx
// Top navigation bar: breadcrumb, notifications, user menu

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronRight, LogOut, Settings, CheckCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';
import { getNotificationsApi, getUnreadCountApi, markAllAsReadApi, markAsReadApi } from '../../api/notificationApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const PAGE_NAMES = {
  '/dashboard': 'Tổng quan',
  '/transactions': 'Giao dịch',
  '/budget': 'Ngân sách',
  '/reports': 'Báo cáo',
  '/ai-chat': 'AI Tư vấn',
  '/categories': 'Danh mục',
  '/wallets': 'Ví / Tài khoản',
  '/settings': 'Cài đặt',
};

const NOTIF_STYLES = {
  system:          { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-600'  },
  budget_warning:  { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600'    },
  budget_exceeded: { bg: 'bg-expense-100 dark:bg-expense-900/30', text: 'text-expense-600'  },
  income:          { bg: 'bg-income-100 dark:bg-income-900/30',   text: 'text-income-600'   },
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [userMenuOpen,      setUserMenuOpen]      = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [loadingNotifs,     setLoadingNotifs]     = useState(false);

  const pageName = PAGE_NAMES[location.pathname] || 'Trang';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCountApi();
      setUnreadCount(count || 0);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const data = await getNotificationsApi({ limit: 20 });
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  // Polling badge mỗi 60 giây
  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  const handleToggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) fetchNotifications();
  };

  const handleReadOne = async (notif) => {
    if (!notif.is_read) {
      try {
        await markAsReadApi(notif.id);
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: 1 } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 h-[var(--navbar-height)] bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 transition-all duration-300"
      style={{ left: 'var(--sidebar-width, 260px)' }}
    >
      <div className="flex items-center h-full px-4 gap-3">

        {/* Hamburger – mobile */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:block">FinanceAI</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
          <span className="font-semibold text-slate-800 dark:text-white">{pageName}</span>
        </div>

        <div className="flex-1" />

        {/* ── Notification bell ── */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-expense-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 ring-2 ring-white dark:ring-dark-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-card-lg border border-slate-100 dark:border-slate-700 z-20 animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Thông báo</p>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-expense-100 text-expense-600 dark:bg-expense-900/30 px-1.5 py-0.5 rounded-full font-semibold">
                        {unreadCount} chưa đọc
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-sm text-slate-400">Đang tải...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      Bạn chưa có thông báo nào.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {notifications.map((notif) => {
                        const style = NOTIF_STYLES[notif.type] || NOTIF_STYLES.system;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleReadOne(notif)}
                            className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.is_read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}
                          >
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                                <Bell className={`w-4 h-4 ${style.text}`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${!notif.is_read ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {dayjs(notif.created_at).fromNow()}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── User menu ── */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
              {user?.name?.split(' ').slice(-1)[0] || 'User'}
            </span>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-800 rounded-2xl shadow-card-lg border border-slate-100 dark:border-slate-700 z-20 animate-slide-up overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Cài đặt
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-expense-600 hover:bg-expense-50 dark:hover:bg-expense-900/20 rounded-xl transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
