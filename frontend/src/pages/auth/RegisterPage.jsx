// pages/auth/RegisterPage.jsx
// Trang đăng ký tài khoản mới

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { registerApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import logo from '../../assets/logo.png';

const schema = yup.object({
  name:            yup.string().min(2, 'Tên ít nhất 2 ký tự').required('Vui lòng nhập họ tên'),
  email:           yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password:        yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

const RegisterPage = () => {
  const [showPass, setShowPass] = useState(false);
  const { login }               = useAuthStore();
  const navigate                = useNavigate();

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const { user, token } = await registerApi(data);
      login(user, token);
      toast.success('Tạo tài khoản thành công! Chào mừng bạn 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-dark-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src={logo} alt="FinanceAI Logo" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-xl font-bold text-slate-800 dark:text-white">FinanceAI</span>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-card-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              Tạo tài khoản
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register('name')}
                  className={`input-base pl-9 ${errors.name ? 'border-expense-400' : ''}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-expense-600">{errors.name.message}</p>}
            </div>

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
                  className={`input-base pl-9 ${errors.email ? 'border-expense-400' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-expense-600">{errors.email.message}</p>}
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  {...register('password')}
                  className={`input-base pl-9 pr-10 ${errors.password ? 'border-expense-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-expense-600">{errors.password.message}</p>}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')}
                  className={`input-base pl-9 ${errors.confirmPassword ? 'border-expense-400' : ''}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-expense-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <a href="#" className="text-primary-600 hover:underline">Điều khoản dịch vụ</a>{' '}
              và{' '}
              <a href="#" className="text-primary-600 hover:underline">Chính sách bảo mật</a>.
            </p>

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              size="lg"
              className="mt-2"
            >
              Tạo tài khoản
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
