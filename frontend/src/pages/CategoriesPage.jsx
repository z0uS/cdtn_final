// pages/CategoriesPage.jsx
// Quản lý danh mục thu/chi: CRUD + icon picker

import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import useTransactionStore from '../store/transactionStore';
import CategoryIcon        from '../components/ui/CategoryIcon';
import Button              from '../components/ui/Button';
import Modal               from '../components/ui/Modal';
import ConfirmDialog       from '../components/ui/ConfirmDialog';

const AVAILABLE_ICONS = [
  'ShoppingBag','UtensilsCrossed','Car','HeartPulse','Gamepad2','GraduationCap',
  'Receipt','Home','Sparkles','PawPrint','Plane','Banknote','Laptop','TrendingUp',
  'Gift','Building2','Coffee','Music','Dumbbell','Book','Camera','Monitor',
  'Bus','Bike','Train','Fuel','Pizza','Shirt','Watch','Phone',
];

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#22c55e','#06b6d4',
  '#3b82f6','#8b5cf6','#ec4899','#10b981','#0ea5e9',
  '#64748b','#a855f7','#d946ef','#78716c','#0891b2',
];

const schema = yup.object({
  name:  yup.string().min(2, 'Tên ít nhất 2 ký tự').required('Nhập tên danh mục'),
  icon:  yup.string().required('Chọn icon'),
  color: yup.string().required('Chọn màu sắc'),
});

const CategoriesPage = () => {
  const { expenseCategories, incomeCategories, addCategory, updateCategory, deleteCategory } =
    useTransactionStore();

  const [tab,       setTab]       = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [selIcon,   setSelIcon]   = useState('ShoppingBag');
  const [selColor,  setSelColor]  = useState('#3b82f6');

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema) });

  const openAdd = () => {
    setEditData(null);
    setSelIcon('ShoppingBag');
    setSelColor('#3b82f6');
    reset({ name: '', icon: 'ShoppingBag', color: '#3b82f6' });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditData(cat);
    setSelIcon(cat.icon);
    setSelColor(cat.color);
    reset({ name: cat.name, icon: cat.icon, color: cat.color });
    setModalOpen(true);
  };

  const pickIcon = (icon) => { setSelIcon(icon); setValue('icon', icon); };
  const pickColor = (color) => {
    setSelColor(color);
    setValue('color', color);
  };

  const bgColor = (hex) => hex + '20';

  const onSubmit = (data) => {
    const catData = { ...data, bgColor: bgColor(data.color) };
    if (editData) {
      updateCategory(editData.id, catData, tab);
      toast.success('Đã cập nhật danh mục');
    } else {
      addCategory(catData, tab);
      toast.success('Đã thêm danh mục mới');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Danh mục</h1>
        <Button icon={Plus} size="sm" onClick={openAdd}>Thêm danh mục</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { val: 'expense', label: 'Chi tiêu' },
          { val: 'income',  label: 'Thu nhập'  },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === val
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const LucideIcon = Icons[cat.icon] || Icons.MoreHorizontal;
          return (
            <div
              key={cat.id}
              className="card p-4 flex flex-col items-center gap-2.5 text-center relative group hover:shadow-card-md transition-all"
            >
              <CategoryIcon category={cat} size="md" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{cat.name}</p>
              {cat.isDefault && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Lock className="w-2.5 h-2.5" /> Mặc định
                </div>
              )}
              {/* Actions */}
              {!cat.isDefault && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1 rounded-lg bg-white dark:bg-dark-800 shadow-sm text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeleteId({ id: cat.id, type: tab })}
                    className="p-1 rounded-lg bg-white dark:bg-dark-800 shadow-sm text-slate-400 hover:text-expense-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              {cat.isDefault && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1 rounded-lg bg-white dark:bg-dark-800 shadow-sm text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Sửa danh mục' : 'Thêm danh mục'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Lưu</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selColor + '20' }}
            >
              {(() => { const I = Icons[selIcon] || Icons.Star; return <I className="w-5 h-5" style={{ color: selColor }} />; })()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Xem trước</p>
              <p className="text-xs text-slate-400">Icon và màu sẽ hiển thị như trên</p>
            </div>
          </div>

          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tên danh mục <span className="text-expense-600">*</span>
            </label>
            <input type="text" placeholder="VD: Mua sắm, Cà phê..." {...register('name')} className="input-base" />
            {errors.name && <p className="mt-1 text-xs text-expense-600">{errors.name.message}</p>}
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Chọn icon <span className="text-expense-600">*</span>
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const Ic = Icons[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => pickIcon(iconName)}
                    className={[
                      'w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all',
                      selIcon === iconName
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100',
                    ].join(' ')}
                    title={iconName}
                  >
                    {Ic && <Ic className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Màu sắc <span className="text-expense-600">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => pickColor(color)}
                  className={[
                    'w-8 h-8 rounded-full border-3 transition-all',
                    selColor === color ? 'scale-110 ring-2 ring-offset-2 ring-primary-500' : 'hover:scale-105',
                  ].join(' ')}
                  style={{ background: color, borderColor: color }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          deleteCategory(deleteId.id, deleteId.type);
          toast.success('Đã xóa danh mục');
          setDeleteId(null);
        }}
        title="Xóa danh mục"
        message="Các giao dịch thuộc danh mục này sẽ không bị xóa. Bạn có chắc chắn muốn xóa?"
      />
    </div>
  );
};

export default CategoriesPage;
