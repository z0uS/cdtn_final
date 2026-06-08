// components/recurring/RecurringModal.jsx
// Modal thêm/sửa giao dịch định kỳ

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AmountInput from '../ui/AmountInput';
import CategoryIcon from '../ui/CategoryIcon';
import useTransactionStore from '../../store/transactionStore';
import dayjs from 'dayjs';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Hàng ngày', icon: '📅' },
  { value: 'weekly', label: 'Hàng tuần', icon: '🗓️' },
  { value: 'monthly', label: 'Hàng tháng', icon: '📆' },
  { value: 'yearly', label: 'Hàng năm', icon: '🎯' },
];

const schema = yup.object({
  type: yup.string().oneOf(['income', 'expense']).required(),
  amount: yup.number().min(1000, 'Số tiền tối thiểu 1.000₫').required('Nhập số tiền'),
  category_id: yup.string().required('Chọn danh mục'),
  account_id: yup.string().required('Chọn ví/tài khoản'),
  frequency: yup.string().oneOf(['daily', 'weekly', 'monthly', 'yearly']).required('Chọn chu kỳ'),
  start_date: yup.string().required('Chọn ngày bắt đầu'),
  description: yup.string().required('Nhập mô tả'),
});

const RecurringModal = ({ isOpen, onClose, onSubmit, editData = null }) => {
  const { expenseCategories, incomeCategories, wallets } = useTransactionStore();

  const {
    register, handleSubmit, control, watch, setValue,
    reset, formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      category_id: '',
      account_id: wallets[0]?.id ? String(wallets[0].id) : '',
      frequency: 'monthly',
      start_date: dayjs().format('YYYY-MM-DD'),
      description: '',
    },
  });

  const type = watch('type');
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  // Fill form khi sửa
  useEffect(() => {
    if (editData) {
      reset({
        type: editData.type,
        amount: parseFloat(editData.amount),
        category_id: String(editData.category_id),
        account_id: String(editData.account_id),
        frequency: editData.frequency,
        start_date: dayjs(editData.start_date).format('YYYY-MM-DD'),
        description: editData.description,
      });
    } else {
      reset({
        type: 'expense', amount: 0, category_id: '',
        account_id: wallets[0]?.id ? String(wallets[0].id) : '',
        frequency: 'monthly',
        start_date: dayjs().format('YYYY-MM-DD'),
        description: '',
      });
    }
  }, [editData, isOpen]);

  // Reset category khi đổi type
  useEffect(() => {
    if (!editData) setValue('category_id', '');
  }, [type]);

  const handleFormSubmit = async (data) => {
    await onSubmit({
      type: data.type,
      amount: data.amount,
      category_id: parseInt(data.category_id, 10),
      account_id: parseInt(data.account_id, 10),
      frequency: data.frequency,
      start_date: data.start_date,
      description: data.description,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <span>{editData ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</span>
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            loading={isSubmitting}
            onClick={handleSubmit(handleFormSubmit)}
          >
            {editData ? 'Cập nhật' : 'Tạo giao dịch'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Loại giao dịch */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Loại giao dịch <span className="text-expense-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'expense', label: 'Chi tiêu', color: 'expense' },
              { value: 'income', label: 'Thu nhập', color: 'income' },
            ].map(({ value, label, color }) => (
              <label
                key={value}
                className={[
                  'flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200',
                  type === value
                    ? color === 'expense'
                      ? 'border-expense-500 bg-expense-50 text-expense-700 dark:bg-expense-900/20'
                      : 'border-income-500 bg-income-50 text-income-700 dark:bg-income-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400',
                ].join(' ')}
              >
                <input type="radio" value={value} {...register('type')} className="sr-only" />
                <span className="text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Chu kỳ */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Chu kỳ lặp lại <span className="text-expense-600">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {FREQUENCY_OPTIONS.map(({ value, label, icon }) => {
              const selected = watch('frequency') === value;
              return (
                <label
                  key={value}
                  className={[
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center',
                    selected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300',
                  ].join(' ')}
                >
                  <input type="radio" value={value} {...register('frequency')} className="sr-only" />
                  <span className="text-lg">{icon}</span>
                  <span className={`text-xs font-semibold leading-tight ${selected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.frequency && <p className="mt-1 text-xs text-expense-600">{errors.frequency.message}</p>}
        </div>

        {/* Số tiền */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <AmountInput
              label="Số tiền"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
            />
          )}
        />

        {/* Danh mục */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Danh mục <span className="text-expense-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const selected = String(watch('category_id')) === String(cat.id);
              return (
                <label
                  key={cat.id}
                  className={[
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    selected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-md ring-1 ring-violet-500'
                      : 'border-slate-100 bg-white dark:bg-dark-800 dark:border-slate-700 hover:border-slate-300',
                  ].join(' ')}
                >
                  <input type="radio" value={cat.id} {...register('category_id')} className="sr-only" />
                  <CategoryIcon category={cat} size="sm" />
                  <span className={`text-xs text-center font-medium leading-tight line-clamp-2 ${selected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.category_id && <p className="mt-1 text-xs text-expense-600">{errors.category_id.message}</p>}
        </div>

        {/* Ví + Ngày bắt đầu */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ví/TK <span className="text-expense-600">*</span>
            </label>
            <select {...register('account_id')} className="select-base">
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.account_id && <p className="mt-1 text-xs text-expense-600">{errors.account_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày bắt đầu <span className="text-expense-600">*</span>
            </label>
            <input type="date" {...register('start_date')} className="input-base" />
            {errors.start_date && <p className="mt-1 text-xs text-expense-600">{errors.start_date.message}</p>}
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Mô tả <span className="text-expense-600">*</span>
          </label>
          <input
            type="text"
            placeholder="VD: Tiền thuê nhà, Lương nhân viên..."
            {...register('description')}
            className="input-base"
          />
          {errors.description && <p className="mt-1 text-xs text-expense-600">{errors.description.message}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default RecurringModal;
