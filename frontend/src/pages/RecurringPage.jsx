// pages/RecurringPage.jsx
// Quản lý giao dịch định kỳ (Recurring Transactions)

import { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw, Plus, Pencil, Trash2, Power, PowerOff,
  CalendarClock, TrendingDown, TrendingUp, ChevronRight,
  Repeat2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import useRecurringStore from '../store/recurringStore';
import useTransactionStore from '../store/transactionStore';
import { formatCurrency } from '../utils/formatCurrency';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryIcon from '../components/ui/CategoryIcon';
import RecurringModal from '../components/recurring/RecurringModal';

const FREQUENCY_LABEL = {
  daily:   { label: 'Hàng ngày',  color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', icon: '📅' },
  weekly:  { label: 'Hàng tuần',  color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', icon: '🗓️' },
  monthly: { label: 'Hàng tháng', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: '📆' },
  yearly:  { label: 'Hàng năm',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '🎯' },
};

const getDaysUntilNext = (nextDate) => {
  const diff = dayjs(nextDate).diff(dayjs().startOf('day'), 'day');
  return diff;
};

const RecurringPage = () => {
  const {
    recurringList, isLoading,
    fetchRecurring, addRecurring, updateRecurring,
    toggleRecurring, deleteRecurring,
  } = useRecurringStore();

  const { expenseCategories, incomeCategories, wallets } = useTransactionStore();

  const [modalOpen, setModalOpen]   = useState(false);
  const [editData, setEditData]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [filterType, setFilterType] = useState('all'); // all | income | expense
  const [filterFreq, setFilterFreq] = useState('all'); // all | daily | weekly | monthly | yearly

  const getCategoryById = (id) =>
    expenseCategories.find((c) => c.id === id) ||
    incomeCategories.find((c) => c.id === id) ||
    { name: 'Khác', icon: 'QuestionMark', color: '#64748b' };

  const getWalletById = (id) => wallets.find((w) => w.id === id);

  useEffect(() => {
    fetchRecurring();
  }, []);

  // Thống kê
  const stats = useMemo(() => {
    const active = recurringList.filter((r) => r.is_active);
    const monthlyExpense = active
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount);
        if (r.frequency === 'daily')   return sum + amount * 30;
        if (r.frequency === 'weekly')  return sum + amount * 4;
        if (r.frequency === 'monthly') return sum + amount;
        if (r.frequency === 'yearly')  return sum + amount / 12;
        return sum;
      }, 0);
    const monthlyIncome = active
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => {
        const amount = parseFloat(r.amount);
        if (r.frequency === 'daily')   return sum + amount * 30;
        if (r.frequency === 'weekly')  return sum + amount * 4;
        if (r.frequency === 'monthly') return sum + amount;
        if (r.frequency === 'yearly')  return sum + amount / 12;
        return sum;
      }, 0);
    const dueToday = recurringList.filter(
      (r) => r.is_active && getDaysUntilNext(r.next_date) <= 0,
    ).length;
    return { active: active.length, total: recurringList.length, monthlyExpense, monthlyIncome, dueToday };
  }, [recurringList]);

  // Lọc danh sách
  const filtered = useMemo(() => {
    let list = [...recurringList];
    if (filterType !== 'all') list = list.filter((r) => r.type === filterType);
    if (filterFreq !== 'all') list = list.filter((r) => r.frequency === filterFreq);
    return list.sort((a, b) => {
      // Active lên trước, sau đó theo next_date
      if (a.is_active !== b.is_active) return b.is_active - a.is_active;
      return new Date(a.next_date) - new Date(b.next_date);
    });
  }, [recurringList, filterType, filterFreq]);

  const handleAdd = () => { setEditData(null); setModalOpen(true); };
  const handleEdit = (item) => { setEditData(item); setModalOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (editData) {
        await updateRecurring(editData.id, data);
        toast.success('Đã cập nhật giao dịch định kỳ');
      } else {
        await addRecurring(data);
        toast.success('Đã tạo giao dịch định kỳ mới');
      }
      setModalOpen(false);
      setEditData(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await toggleRecurring(id);
      toast.success(currentActive ? 'Đã tạm dừng' : 'Đã kích hoạt lại');
    } catch {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecurring(deleteId);
      toast.success('Đã xóa giao dịch định kỳ');
      setDeleteId(null);
    } catch {
      toast.error('Không thể xóa giao dịch');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Repeat2 className="w-5 h-5 text-violet-600" />
            Giao dịch định kỳ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý các khoản thu/chi tự động lặp lại
          </p>
        </div>
        <Button
          icon={Plus}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleAdd}
        >
          Thêm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Đang hoạt động',
            value: `${stats.active}/${stats.total}`,
            icon: CheckCircle2,
            iconColor: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: 'Đến hạn hôm nay',
            value: stats.dueToday,
            icon: AlertCircle,
            iconColor: stats.dueToday > 0 ? 'text-amber-600' : 'text-slate-400',
            bg: stats.dueToday > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800',
          },
          {
            label: 'Chi ước tính/tháng',
            value: formatCurrency(stats.monthlyExpense, true),
            icon: TrendingDown,
            iconColor: 'text-expense-600',
            bg: 'bg-expense-50 dark:bg-expense-900/20',
          },
          {
            label: 'Thu ước tính/tháng',
            value: formatCurrency(stats.monthlyIncome, true),
            icon: TrendingUp,
            iconColor: 'text-income-600',
            bg: 'bg-income-50 dark:bg-income-900/20',
          },
        ].map(({ label, value, icon: Icon, iconColor, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4.5 h-4.5 ${iconColor}`} size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lọc theo:</span>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {[
            { val: 'all',     label: 'Tất cả' },
            { val: 'income',  label: 'Thu nhập' },
            { val: 'expense', label: 'Chi tiêu' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilterType(val)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterType === val
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* Frequency filter */}
        <div className="flex gap-1.5">
          {[
            { val: 'all',     label: 'Mọi chu kỳ' },
            { val: 'daily',   label: 'Ngày' },
            { val: 'weekly',  label: 'Tuần' },
            { val: 'monthly', label: 'Tháng' },
            { val: 'yearly',  label: 'Năm' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilterFreq(val)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterFreq === val
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Chưa có giao dịch định kỳ nào"
            description="Tạo giao dịch định kỳ để hệ thống tự động ghi nhận các khoản thu/chi lặp lại."
            action={handleAdd}
            actionLabel="Tạo ngay"
          />
        ) : (
          filtered.map((item) => {
            const freqInfo = FREQUENCY_LABEL[item.frequency] || FREQUENCY_LABEL.monthly;
            const daysLeft = getDaysUntilNext(item.next_date);
            const cat = {
              name:  item.category_name  || 'Khác',
              icon:  item.category_icon  || 'QuestionMark',
              color: item.category_color || '#64748b',
            };
            const wallet = getWalletById(item.account_id) || { name: item.account_name || '–' };

            const isDue     = daysLeft <= 0;
            const isSoon    = daysLeft > 0 && daysLeft <= 3;
            const isInactive = !item.is_active;

            return (
              <div
                key={item.id}
                className={[
                  'card p-4 transition-all duration-200 hover:shadow-md group',
                  isInactive ? 'opacity-60' : '',
                  isDue && !isInactive ? 'ring-1 ring-amber-400/50' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  {/* Category icon */}
                  <div className={`relative flex-shrink-0 ${isInactive ? 'grayscale' : ''}`}>
                    <CategoryIcon category={cat} size="md" />
                    {!isInactive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                        <RefreshCw className="w-2 h-2 text-violet-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {item.description}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${freqInfo.color}`}>
                        {freqInfo.icon} {freqInfo.label}
                      </span>
                      {isInactive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          Tạm dừng
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span>{cat.name}</span>
                      </span>
                      <span>·</span>
                      <span>{wallet.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {isDue ? (
                          <span className="text-amber-600 font-medium">Đến hạn hôm nay!</span>
                        ) : isSoon ? (
                          <span className="text-amber-500 font-medium">Còn {daysLeft} ngày</span>
                        ) : (
                          <span>Kỳ tiếp: {dayjs(item.next_date).format('DD/MM/YYYY')}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Amount + Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm font-bold ${item.type === 'income' ? 'text-income-600' : 'text-expense-600'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">{freqInfo.label}</p>
                    </div>

                    {/* Action buttons - hiện khi hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggle(item.id, item.is_active)}
                        title={item.is_active ? 'Tạm dừng' : 'Kích hoạt lại'}
                        className={[
                          'p-1.5 rounded-lg transition-colors',
                          item.is_active
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                        ].join(' ')}
                      >
                        {item.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                        title="Sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-expense-600 hover:bg-expense-50 dark:hover:bg-expense-900/20 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>

                {/* Mobile amount */}
                <div className="sm:hidden mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                  <p className={`text-sm font-bold ${item.type === 'income' ? 'text-income-600' : 'text-expense-600'}`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ {freqInfo.label.toLowerCase()}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(item.id, item.is_active)}
                      className={[
                        'p-1.5 rounded-lg transition-colors',
                        item.is_active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
                      ].join(' ')}
                    >
                      {item.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-expense-600 hover:bg-expense-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info box */}
      {!isLoading && recurringList.length > 0 && (
        <div className="card p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/40">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">Hệ thống tự động xử lý</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                Giao dịch định kỳ được hệ thống tự động ghi nhận vào 00:00 mỗi ngày theo lịch đã cài đặt.
                Bạn có thể tạm dừng hoặc kích hoạt lại bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecurringModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSubmit={handleSubmit}
        editData={editData}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa giao dịch định kỳ"
        message="Giao dịch định kỳ này sẽ bị xóa vĩnh viễn. Các giao dịch đã tạo trước đó vẫn được giữ lại. Bạn có chắc chắn?"
      />
    </div>
  );
};

export default RecurringPage;
