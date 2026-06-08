// pages/SettingsPage.jsx
// Cài đặt: hồ sơ cá nhân, đổi mật khẩu, tiền tệ, thông báo, dark mode

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Globe, Moon, LogOut, Save, Camera } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUIStore   from '../store/uiStore';
import Button       from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { changePasswordApi, updateProfileApi, uploadAvatarApi } from '../api/authApi';

const profileSchema = yup.object({
  name:  yup.string().min(2, 'Tên ít nhất 2 ký tự').required('Nhập họ tên'),
  email: yup.string().email('Email không hợp lệ').required('Nhập email'),
});

const passwordSchema = yup.object({
  oldPassword: yup.string().min(6).required('Nhập mật khẩu hiện tại'),
  newPassword: yup.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự').required('Nhập mật khẩu mới'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu mới'),
});

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
      <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <h2 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate                     = useNavigate();

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const [currency,      setCurrency]      = useState(user?.currency || 'VND');
  const [notifications, setNotifications] = useState({
    email:  true,
    push:   false,
    budget: true,
  });

  // Profile form
  const {
    register: regP, handleSubmit: handleP, formState: { errors: errP, isSubmitting: subP },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  // Password form
  const {
    register: regPwd, handleSubmit: handlePwd, reset: resetPwd,
    formState: { errors: errPwd, isSubmitting: subPwd },
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const onProfileSubmit = async (data) => {
    try {
      await updateProfileApi({ full_name: data.name, email: data.email });
      updateUser({ name: data.name, email: data.email });
      toast.success('Đã cập nhật hồ sơ');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await changePasswordApi({ oldPassword: data.oldPassword, newPassword: data.newPassword });
      toast.success('Đã đổi mật khẩu thành công');
      resetPwd();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi đổi mật khẩu. Vui lòng kiểm tra lại');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ (JPG, PNG)');
      return;
    }

    try {
      setIsUploading(true);
      const avatarUrl = await uploadAvatarApi(file);
      updateUser({ avatar: avatarUrl });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white">Cài đặt</h1>

      {/* Hồ sơ cá nhân */}
      <SectionCard icon={User} title="Hồ sơ cá nhân">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800">
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <p 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary-600 mt-1 cursor-pointer hover:underline"
            >
              {isUploading ? 'Đang tải ảnh lên...' : 'Thay đổi ảnh đại diện'}
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleP(onProfileSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Họ và tên</label>
            <input type="text" {...regP('name')} className="input-base" />
            {errP.name && <p className="mt-1 text-xs text-expense-600">{errP.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input type="email" {...regP('email')} className="input-base" />
            {errP.email && <p className="mt-1 text-xs text-expense-600">{errP.email.message}</p>}
          </div>
          <Button type="submit" icon={Save} loading={subP}>Lưu thay đổi</Button>
        </form>
      </SectionCard>

      {/* Đổi mật khẩu */}
      <SectionCard icon={Lock} title="Bảo mật">
        <form className="space-y-4" onSubmit={handlePwd(onPasswordSubmit)}>
          {[
            { name: 'oldPassword', label: 'Mật khẩu hiện tại', err: errPwd.oldPassword },
            { name: 'newPassword', label: 'Mật khẩu mới',      err: errPwd.newPassword },
            { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', err: errPwd.confirmPassword },
          ].map(({ name, label, err }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
              <input type="password" placeholder="••••••••" {...regPwd(name)} className="input-base" />
              {err && <p className="mt-1 text-xs text-expense-600">{err.message}</p>}
            </div>
          ))}
          <Button type="submit" icon={Lock} loading={subPwd}>Đổi mật khẩu</Button>
        </form>
      </SectionCard>

      {/* Tiền tệ */}
      <SectionCard icon={Globe} title="Cài đặt tiền tệ">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Đơn vị tiền tệ</label>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); toast.success(`Đã chuyển sang ${e.target.value}`); }}
            className="select-base max-w-xs"
          >
            <option value="VND">🇻🇳 VND – Việt Nam Đồng</option>
            <option value="USD">🇺🇸 USD – Đô la Mỹ</option>
            <option value="EUR">🇪🇺 EUR – Euro</option>
            <option value="JPY">🇯🇵 JPY – Yên Nhật</option>
            <option value="SGD">🇸🇬 SGD – Đô la Singapore</option>
          </select>
        </div>
      </SectionCard>

      {/* Thông báo */}
      <SectionCard icon={Bell} title="Thông báo">
        <Toggle
          label="Thông báo qua email"
          description="Nhận báo cáo tài chính hàng tuần qua email"
          checked={notifications.email}
          onChange={() => {
            setNotifications((n) => ({ ...n, email: !n.email }));
            toast.success('Đã cập nhật cài đặt thông báo');
          }}
        />
        <Toggle
          label="Thông báo đẩy"
          description="Nhận thông báo trực tiếp trên browser"
          checked={notifications.push}
          onChange={() => setNotifications((n) => ({ ...n, push: !n.push }))}
        />
        <Toggle
          label="Cảnh báo ngân sách"
          description="Thông báo khi chi tiêu đạt 80% hạn mức"
          checked={notifications.budget}
          onChange={() => setNotifications((n) => ({ ...n, budget: !n.budget }))}
        />
      </SectionCard>

      {/* Giao diện */}
      <SectionCard icon={Moon} title="Giao diện">
        <Toggle
          label="Chế độ tối (Dark Mode)"
          description="Giảm mỏi mắt khi dùng ban đêm"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
      </SectionCard>

      {/* Đăng xuất */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Đăng xuất</p>
            <p className="text-xs text-slate-400 mt-0.5">Thoát khỏi tài khoản trên thiết bị này</p>
          </div>
          <Button variant="danger" icon={LogOut} onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
