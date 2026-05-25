// routes/AppRouter.jsx
// Cấu hình toàn bộ routes của ứng dụng

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

// Lazy load các trang để tối ưu bundle size
const LoginPage    = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const Dashboard    = lazy(() => import('../pages/DashboardPage'));
const Transactions = lazy(() => import('../pages/TransactionsPage'));
const Budget       = lazy(() => import('../pages/BudgetPage'));
const Reports      = lazy(() => import('../pages/ReportsPage'));
const AiChat       = lazy(() => import('../pages/AiChatPage'));
const Categories   = lazy(() => import('../pages/CategoriesPage'));
const Wallets      = lazy(() => import('../pages/WalletsPage'));
const Settings     = lazy(() => import('../pages/SettingsPage'));
const HealthScore  = lazy(() => import('../pages/HealthScorePage'));

// Fallback loading khi lazy load
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
    </div>
  </div>
);

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes – bọc trong MainLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route index                    element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/transactions"     element={<Transactions />} />
            <Route path="/budget"           element={<Budget />} />
            <Route path="/reports"          element={<Reports />} />
            <Route path="/ai-chat"          element={<AiChat />} />
            <Route path="/categories"       element={<Categories />} />
            <Route path="/wallets"          element={<Wallets />} />
            <Route path="/settings"         element={<Settings />} />
            <Route path="/health-score"      element={<HealthScore />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
