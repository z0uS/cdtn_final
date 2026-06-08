// pages/auth/LoginPage.jsx
// Trang đăng nhập với glassmorphism design

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { loginApi, forgotPasswordApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import logo from '../../assets/logo.png';

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
});

const LoginPage = () => {
  const [showPass, setShowPass] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoginError('');
    try {
      const { user, token } = await loginApi(data);
      login(user, token);
      toast.success(`Chào mừng trở lại, ${user.name || user.full_name}! 👋`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setLoginError(msg);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return toast.error('Vui lòng nhập email');
    if (!forgotPassword || forgotPassword.length < 6) return toast.error('Vui lòng nhập mật khẩu mới (ít nhất 6 ký tự)');
    setIsResetting(true);
    try {
      const res = await forgotPasswordApi({ email: forgotEmail, newPassword: forgotPassword });
      toast.success(res.message || 'Mật khẩu đã được đặt lại!');
      setShowForgotModal(false);
      setForgotEmail('');
      setForgotPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – gradient background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-900/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 text-white text-center max-w-md">
          <img src={logo} alt="FinanceAI Logo" className="w-16 h-16 rounded-2xl mx-auto mb-6 object-cover shadow-lg" />
          <h1 className="text-3xl font-bold mb-3">FinanceAI</h1>
          <p className="text-primary-100 text-lg mb-8">QUẢN LÝ CHI TIÊU THÔNG MINH CÙNG AI</p>

          <div className="space-y-4">
            {[
              { icon: '📊'  , text: 'Theo dõi thu chi real-time' },
              { icon: '🤖', text: 'AI phân tích và tư vấn tài chính' },
              { icon: '📈', text: 'Báo cáo thống kê chi tiết' },
              { icon: '🎯', text: 'Đặt ngân sách và nhắc nhở' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-100">
                <span className="text-2xl">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-dark-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src={logo} alt="FinanceAI Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">FinanceAI</span>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-card-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                Đăng nhập
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>



            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Thông báo lỗi đăng nhập */}
              {loginError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <span className="text-red-500 text-base flex-shrink-0">⚠️</span>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{loginError}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="ten@email.com"
                    {...register('email')}
                    onChange={() => setLoginError('')}
                    className={`input-base pl-9 ${errors.email ? 'border-expense-400 focus:ring-expense-500/30' : ''}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-expense-600">{errors.email.message}</p>}
              </div>


              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-primary-600 hover:underline">Quên mật khẩu?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`input-base pl-9 pr-10 ${errors.password ? 'border-expense-400 focus:ring-expense-500/30' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-expense-600">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
                size="lg"
                className="mt-6"
              >
                Đăng nhập
              </Button>
            </form>


          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Quên mật khẩu"
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setShowForgotModal(false)}>
              Huỷ
            </Button>
            <Button loading={isResetting} onClick={handleForgotPassword}>
              Xác nhận
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nhập email tài khoản và mật khẩu mới bạn muốn đặt.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="ten@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="input-base pl-9"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showForgotPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={forgotPassword}
                onChange={(e) => setForgotPassword(e.target.value)}
                className="input-base pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowForgotPass(!showForgotPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
