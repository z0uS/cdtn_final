import { useMemo, useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Layers, PiggyBank, Sparkles, Wallet, CheckCircle2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import useTransactionStore from '../store/transactionStore';
import { formatCurrency } from '../utils/formatCurrency';
import { sumBy, calcPercent } from '../utils/calcPercent';
import BudgetProgressBar from '../components/ui/BudgetProgressBar';
import AmountInput from '../components/ui/AmountInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SpendingStrategyPage from './SpendingStrategyPage';
import dayjs from 'dayjs';
import { getBudgetSuggestionsApi } from '../api/mlApi';
import useAuthStore from '../store/authStore';

const schema = yup.object({
  categoryId: yup.string().required('Chọn danh mục'),
  limit: yup.number().min(10000, 'Tối thiểu 10.000₫').required('Nhập hạn mức'),
});

/* ─── Sub-tab: Quản lý ngân sách ─────── */
const BudgetManager = () => {
  const { transactions, expenseCategories, wallets, addBudget, updateBudget, deleteBudget } =
    useTransactionStore();
  const { user } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedWalletIds, setSelectedWalletIds] = useState([]); // Ví được ánh xạ với ngân sách
  const [mlSuggestions, setMlSuggestions] = useState([]); // Gợi ý từ ML

  // ── Bộ chọn tháng ──────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [monthBudgets, setMonthBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Fetch ngân sách theo tháng được chọn
  const fetchMonthBudgets = async (ym) => {
    setLoadingBudgets(true);
    try {
      const [year, month] = ym.split('-');
      const { getBudgetsApi: fetchApi } = await import('../api/budgetApi');
      const buds = await fetchApi(Number(month), Number(year));
      const mapped = buds.map(b => ({
        id: b.id,
        categoryId: b.category_id,
        limit: parseFloat(b.amount_limit),
        period: 'month',
        month: `${b.year}-${String(b.month).padStart(2, '0')}`,
      }));
      setMonthBudgets(mapped);
    } catch {
      setMonthBudgets([]);
    } finally {
      setLoadingBudgets(false);
    }
  };

  // Load lần đầu và khi đổi tháng
  useEffect(() => { fetchMonthBudgets(selectedMonth); }, [selectedMonth]);

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    fetchMonthBudgets(val);
  };

  const thisMonth = dayjs().format('YYYY-MM');

  // Tính chi tiêu trong tháng được chọn từ giao dịch đã có
  const monthTxs = transactions.filter(
    (t) => t.date?.startsWith(selectedMonth) && t.type === 'expense'
  );

  const budgetSpent = useMemo(() => {
    const result = {};
    monthBudgets.forEach((b) => {
      result[b.id] = sumBy(monthTxs.filter((t) => t.categoryId === b.categoryId), 'amount');
    });
    return result;
  }, [monthBudgets, monthTxs]);

  const totalLimit = useMemo(() => sumBy(monthBudgets, 'limit'), [monthBudgets]);
  const totalSpent = useMemo(() => Object.values(budgetSpent).reduce((s, v) => s + v, 0), [budgetSpent]);
  const exceededCount = monthBudgets.filter((b) => calcPercent(budgetSpent[b.id] || 0, b.limit) >= 100).length;
  const warningCount = monthBudgets.filter((b) => { const p = calcPercent(budgetSpent[b.id] || 0, b.limit); return p >= 80 && p < 100; }).length;

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema) });

  const selectedCategoryId = watch('categoryId');

  const openAdd = async () => {
    setEditData(null);
    setSelectedWalletIds([]);
    reset({ categoryId: '', limit: 0 });
    setModalOpen(true);
    // Tự động fetch gợi ý ngân sách từ ML
    try {
      const result = await getBudgetSuggestionsApi(user?.id || 1);
      if (result?.suggestions) setMlSuggestions(result.suggestions);
    } catch { setMlSuggestions([]); }
  };
  const openEdit = (b) => {
    setEditData(b);
    setSelectedWalletIds(Array.isArray(b.accountIds) ? b.accountIds : []);
    reset({ categoryId: b.categoryId, limit: b.limit });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = { ...data, period: 'month', month: thisMonth, accountIds: selectedWalletIds };
    try {
      if (editData) { await updateBudget(editData.id, payload); }
      else { await addBudget(payload); }
      toast.success(editData ? 'Đã cập nhật ngân sách' : 'Đã thêm ngân sách mới');
      setModalOpen(false);
      fetchMonthBudgets(selectedMonth); // Refresh
    } catch { toast.error('Có lỗi xảy ra, thử lại sau'); }
  };

  // Tổng số dư các ví được chọn
  const selectedWalletsTotal = useMemo(() =>
    wallets.filter(w => selectedWalletIds.includes(w.id)).reduce((s, w) => s + w.balance, 0)
  , [selectedWalletIds, wallets]);

  const usedCategoryIds = monthBudgets.map((b) => b.categoryId);
  const availableCats = expenseCategories.filter(
    (c) => !usedCategoryIds.includes(c.id) || editData?.categoryId === c.id,
  );

  const isPastMonth = selectedMonth < thisMonth;

  return (
    <div className="space-y-5">
      {/* Header + Month picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tháng:</p>
          <input
            type="month"
            value={selectedMonth}
            max={dayjs().format('YYYY-MM')}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="input-base text-sm w-auto"
          />
          {selectedMonth === thisMonth && (
            <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
              Tháng hiện tại
            </span>
          )}
          {isPastMonth && (
            <span className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
              Tháng đã qua
            </span>
          )}
        </div>
        {!isPastMonth && (
          <Button icon={Plus} size="sm" onClick={openAdd}>Thêm ngân sách</Button>
        )}
      </div>

      {/* Alert */}
      {(exceededCount > 0 || warningCount > 0) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Cảnh báo ngân sách</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {exceededCount > 0 && `${exceededCount} danh mục đã vượt hạn mức. `}
              {warningCount > 0 && `${warningCount} danh mục sắp đạt hạn mức (≥80%).`}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {monthBudgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tổng hạn mức', value: formatCurrency(totalLimit), color: 'text-primary-600' },
            { label: 'Đã chi tiêu', value: formatCurrency(totalSpent), color: 'text-expense-600' },
            { label: 'Còn lại', value: formatCurrency(totalLimit - totalSpent), color: totalLimit >= totalSpent ? 'text-income-600' : 'text-expense-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Budget list */}
      {loadingBudgets ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
          Đang tải...
        </div>
      ) : monthBudgets.length === 0 ? (
        <EmptyState
          title={`Không có ngân sách nào trong tháng ${dayjs(selectedMonth).format('MM/YYYY')}`}
          description={isPastMonth ? 'Tháng này không có ngân sách nào được tạo.' : 'Thêm hạn mức hoặc dùng tab Chiến lược để tự động tạo từ quy tắc tài chính.'}
          action={isPastMonth ? undefined : openAdd}
          actionLabel="Thêm ngân sách đầu tiên"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthBudgets.map((b) => {
            const spent = budgetSpent[b.id] || 0;
            return (
              <div key={b.id} className="relative group">
                <BudgetProgressBar budget={b} spent={spent} />
                {!isPastMonth && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-white dark:bg-dark-800 shadow-sm text-slate-400 hover:text-primary-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg bg-white dark:bg-dark-800 shadow-sm text-slate-400 hover:text-expense-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal thêm/sửa — chỉ hiện khi xem tháng hiện tại */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Sửa ngân sách' : 'Thêm ngân sách'} size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Lưu</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Danh mục <span className="text-expense-600">*</span>
            </label>
            <select {...register('categoryId')} className="select-base" disabled={!!editData}>
              <option value="">-- Chọn danh mục --</option>
              {availableCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-expense-600">{errors.categoryId.message}</p>}
          </div>

          {/* ── Chọn ví nguồn ────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Wallet className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
              Ví nguồn <span className="text-xs text-slate-400 font-normal">(tuỳ chọn, có thể chọn nhiều)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => {
                const isSelected = selectedWalletIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletIds(prev =>
                      isSelected ? prev.filter(id => id !== w.id) : [...prev, w.id]
                    )}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300',
                    ].join(' ')}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: w.color || '#2563eb' }}
                    />
                    <span>{w.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400'}>
                      {formatCurrency(w.balance)}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Tổng số dư các ví đã chọn */}
            {selectedWalletIds.length > 0 && (
              <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <span className="text-xs text-indigo-600 dark:text-indigo-400">
                  Tổng số dư {selectedWalletIds.length} ví đã chọn:
                </span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(selectedWalletsTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Gợi ý ngân sách tự động từ ML — hiện khi chọn danh mục */}
          {!editData && mlSuggestions.length > 0 && (() => {
            if (!selectedCategoryId) return null;
            const cat = availableCats.find(c => String(c.id) === String(selectedCategoryId));
            if (!cat) return null;

            const normalize = (str) =>
              str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            const dbCatNorm = normalize(cat.name);
            const suggestion = mlSuggestions.find(s => {
              const mlCatNorm = normalize(s.category);
              return (
                dbCatNorm === mlCatNorm ||
                dbCatNorm.includes(mlCatNorm) ||
                mlCatNorm.includes(dbCatNorm)
              );
            });
            if (!suggestion || !suggestion.suggested_limit) return null;
            return (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Gợi ý từ hệ thống: {formatCurrency(suggestion.suggested_limit)}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {suggestion.is_personal && suggestion.based_on_months > 0
                        ? `Dựa trên lịch sử chi tiêu ${suggestion.based_on_months} tháng của bạn`
                        : 'Dự toán dựa trên chi tiêu chung của hệ thống'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('limit', suggestion.suggested_limit)}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex-shrink-0"
                >
                  Áp dụng
                </button>
              </div>
            );
          })()}

          <Controller
            name="limit" control={control}
            render={({ field }) => (
              <AmountInput label="Hạn mức chi tiêu" required value={field.value} onChange={field.onChange} error={errors.limit?.message} />
            )}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try { await deleteBudget(deleteId); toast.success('Đã xóa ngân sách'); setDeleteId(null); fetchMonthBudgets(selectedMonth); }
          catch { toast.error('Có lỗi xảy ra'); setDeleteId(null); }
        }}
        title="Xóa ngân sách"
        message="Ngân sách này sẽ bị xóa. Bạn có thể thêm lại bất cứ lúc nào."
      />
    </div>
  );
};

/* ─── Trang chính với 2 Tabs ──────────────────── */
const TABS = [
  { id: 'strategy', icon: Layers, label: 'Chiến lược phân bổ' },
  { id: 'manage', icon: PiggyBank, label: 'Quản lý ngân sách' },
];

const BudgetPage = () => {
  const [activeTab, setActiveTab] = useState('strategy');

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Ngân sách</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hoạch định và theo dõi chi tiêu theo kế hoạch</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-white dark:bg-dark-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'strategy' ? <SpendingStrategyPage /> : <BudgetManager />}
    </div>
  );
};

export default BudgetPage;
