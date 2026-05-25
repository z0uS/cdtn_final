// components/layout/Sidebar.jsx
// Sidebar navigation responsive với collapse trên mobile

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart2,
  Bot, Tag, Wallet, Settings, ChevronLeft, ChevronRight,
  LogOut, Sun, Moon, Heart,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore   from '../../store/uiStore';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Tổng quan'      },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Giao dịch'      },
  { to: '/budget',       icon: PiggyBank,       label: 'Ngân sách'      },
  { to: '/reports',      icon: BarChart2,       label: 'Báo cáo'        },
  { to: '/ai-chat',      icon: Bot,             label: 'AI Tư vấn'      },
  { to: '/health-score', icon: Heart,           label: 'Sức khoẻ TC'   },
  { to: '/categories',   icon: Tag,             label: 'Danh mục'       },
  { to: '/wallets',      icon: Wallet,          label: 'Ví / Tài khoản'  },
  { to: '/settings',     icon: Settings,        label: 'Cài đặt'        },
];

const Sidebar = () => {
  const { user, logout }              = useAuthStore();
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  const collapsed = !sidebarOpen;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 z-30 h-screen bg-white dark:bg-dark-800',
          'border-r border-slate-100 dark:border-slate-700/50',
          'flex flex-col transition-all duration-300 ease-in-out',
          'shadow-card-lg',
          collapsed ? 'w-[70px]' : 'w-[var(--sidebar-width)]',
          // Mobile: hide/show
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo + Toggle */}
        <div className={`flex items-center h-[var(--navbar-height)] px-4 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="FinanceAI Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white">FinanceAI</span>
                <p className="text-[10px] text-slate-400 leading-none">Smart Money</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom area: dark mode + logout + avatar */}
        <div className={`border-t border-slate-100 dark:border-slate-700/50 p-3 space-y-1 flex-shrink-0`}>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            className={`sidebar-link w-full ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {darkMode
              ? <Sun  className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              : <Moon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            }
            {!collapsed && <span>{darkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className={`sidebar-link w-full text-expense-600 hover:bg-expense-50 dark:hover:bg-expense-900/20 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>

          {/* Avatar */}
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 p-2 mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${user.avatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
