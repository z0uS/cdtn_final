// pages/TransactionsPage.jsx
// Quản lý giao dịch: CRUD + filter + search + phân trang

import { useMemo, useState } from 'react';
import {
  Plus, Search, Filter, Trash2, Pencil, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import useTransactionStore from '../store/transactionStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate }     from '../utils/formatDate';
import { sumBy }           from '../utils/calcPercent';
import CategoryIcon        from '../components/ui/CategoryIcon';
import Button              from '../components/ui/Button';
import ConfirmDialog       from '../components/ui/ConfirmDialog';
import EmptyState          from '../components/ui/EmptyState';
import TransactionModal    from '../components/transaction/TransactionModal';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const TransactionsPage = () => {
  const { transactions, wallets, expenseCategories, incomeCategories, deleteTransaction } =
    useTransactionStore();
  const getCategoryById = (id) => expenseCategories.find(c => c.id === id) || incomeCategories.find(c => c.id === id) || { name: 'Khác', icon: 'QuestionMark' };

  const [modalOpen, setModalOpen]       = useState(false);
  const [editData,  setEditData]        = useState(null);
  const [deleteId,  setDeleteId]        = useState(null);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('all');   // all | income | expense
  const [filterCat,  setFilterCat]      = useState('all');
  const [filterStart, setFilterStart]   = useState('');
  const [filterEnd,   setFilterEnd]     = useState('');

  const allCategories = [...expenseCategories, ...incomeCategories];

  // Lọc + tìm kiếm
  const filtered = useMemo(() => {
    let result = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(q));
    }
    if (filterType !== 'all') result = result.filter((t) => t.type === filterType);
    if (filterCat  !== 'all') result = result.filter((t) => t.categoryId === filterCat);
    if (filterStart)          result = result.filter((t) => t.date >= filterStart);
    if (filterEnd)            result = result.filter((t) => t.date <= filterEnd);

    return result;
  }, [transactions, search, filterType, filterCat, filterStart, filterEnd]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalIncome  = useMemo(() => sumBy(filtered.filter((t) => t.type === 'income'),  'amount'), [filtered]);
  const totalExpense = useMemo(() => sumBy(filtered.filter((t) => t.type === 'expense'), 'amount'), [filtered]);

  const handleEdit = (tx) => {
    setEditData(tx);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteTransaction(deleteId);
      toast.success('Đã xóa giao dịch');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa giao dịch');
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  // Xuất CSV
  const exportCSV = () => {
    const header = 'Ngày,Loại,Danh mục,Mô tả,Số tiền,Ghi chú';
    const rows = filtered.map((t) => [
      t.date,
      t.type === 'income' ? 'Thu' : 'Chi',
      getCategoryById(t.categoryId).name,
      `"${t.description}"`,
      t.amount,
      `"${t.note || ''}"`,
    ].join(','));
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `giao-dich-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV');
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Giao dịch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} giao dịch</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={exportCSV}>
            Xuất CSV
          </Button>
          <Button icon={Plus} size="sm" onClick={handleAdd}>
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng thu', value: totalIncome,  color: 'text-income-600',  bg: 'bg-income-50',  icon: TrendingUp   },
          { label: 'Tổng chi', value: totalExpense, color: 'text-expense-600', bg: 'bg-expense-50', icon: TrendingDown },
          { label: 'Chênh lệch', value: totalIncome - totalExpense, color: totalIncome >= totalExpense ? 'text-income-600' : 'text-expense-600', bg: 'bg-primary-50', icon: TrendingUp },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className={`text-sm font-bold ${color} truncate`}>{formatCurrency(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        {/* Search + Type */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mô tả..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="input-base pl-9"
            />
          </div>
          <div className="flex gap-2">
            {[
              { val: 'all',     label: 'Tất cả'  },
              { val: 'income',  label: 'Thu nhập' },
              { val: 'expense', label: 'Chi tiêu' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => { setFilterType(val); resetPage(); }}
                className={[
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  filterType === val
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Date range */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value); resetPage(); }}
            className="select-base flex-1"
          >
            <option value="all">Tất cả danh mục</option>
            <optgroup label="Chi tiêu">
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Thu nhập">
              {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          </select>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => { setFilterStart(e.target.value); resetPage(); }}
            className="input-base flex-1"
            placeholder="Từ ngày"
          />
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => { setFilterEnd(e.target.value); resetPage(); }}
            className="input-base flex-1"
            placeholder="Đến ngày"
          />
          {(search || filterType !== 'all' || filterCat !== 'all' || filterStart || filterEnd) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch(''); setFilterType('all'); setFilterCat('all');
                setFilterStart(''); setFilterEnd(''); resetPage();
              }}
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState
            title="Không có giao dịch nào"
            description="Thử thay đổi bộ lọc hoặc thêm giao dịch mới."
            action={handleAdd}
            actionLabel="Thêm giao dịch"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {['Ngày','Mô tả','Danh mục','Ví','Số tiền',''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 first:rounded-tl-2xl last:rounded-tr-2xl">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {paginated.map((tx) => {
                    const cat    = getCategoryById(tx.categoryId);
                    const wallet = wallets.find((w) => w.id === tx.walletId);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700 dark:text-slate-300">{tx.description}</p>
                          {tx.note && <p className="text-xs text-slate-400 mt-0.5">{tx.note}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={cat} size="xs" />
                            <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {wallet?.name || '–'}
                        </td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">
                          <span className={tx.type === 'income' ? 'text-income-600' : 'text-expense-600'}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-expense-600 hover:bg-expense-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.map((tx) => {
                const cat = getCategoryById(tx.categoryId);
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-4">
                    <CategoryIcon category={cat} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{tx.description}</p>
                      <p className="text-xs text-slate-400">{cat.name} · {formatDate(tx.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income-600' : 'text-expense-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, true)}
                      </p>
                      <div className="flex gap-1 justify-end mt-1">
                        <button onClick={() => handleEdit(tx)} className="p-1 text-slate-400 hover:text-primary-600">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteId(tx.id)} className="p-1 text-slate-400 hover:text-expense-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={[
                          'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                          page === p
                            ? 'bg-primary-600 text-white'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700',
                        ].join(' ')}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa giao dịch"
        message="Giao dịch sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn?"
      />
    </div>
  );
};

export default TransactionsPage;
