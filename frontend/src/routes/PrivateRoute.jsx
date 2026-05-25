// routes/PrivateRoute.jsx
// Bảo vệ route: redirect về /login nếu chưa đăng nhập

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Lưu lại trang muốn truy cập để redirect sau khi đăng nhập
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
