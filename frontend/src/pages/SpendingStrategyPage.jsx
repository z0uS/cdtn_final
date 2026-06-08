// pages/SpendingStrategyPage.jsx
// Trang chiến lược phân bổ chi tiêu (50/30/20, 6 chiếc lọ, custom)

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Sparkles, CheckCircle, ChevronRight, X, Wallet, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import useTransactionStore from '../store/transactionStore';
import { formatCurrency } from '../utils/formatCurrency';
import dayjs from 'dayjs';

/* ─── Helpers ─────────────────────────────────── */
const PRESET_COLORS = [
  '#2563EB','#7C3AED','#16A34A','#D97706',
  '#EC4899','#059669','#DC2626','#0891B2','#EA580C',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{d.name}</p>
      <p style={{ color: d.payload.color }}>{d.value}% · {formatCurrency(d.payload.amount || 0)}</p>
    </div>
  );
};

/* ─── Component con: Thẻ phương pháp ─────────── */
const MethodCard = ({ method, selected, onSelect, onDelete }) => {
  const totalPct = method.allocations?.reduce((s, a) => s + Number(a.percentage), 0) || 0;
  return (
    <div
      onClick={() => onSelect(method)}
      className={[
        'relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 hover:border-indigo-300',
      ].join(' ')}
    >
      {selected && (
        <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-indigo-500" />
      )}
      {!method.is_system && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(method.id); }}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{method.icon}</span>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{method.name}</p>
          {!method.is_system && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-medium">
              Tuỳ chỉnh
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{method.description}</p>

      {/* Mini bars */}
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        {method.allocations?.map((a, i) => (
          <div
            key={i}
            style={{ width: `${a.percentage}%`, backgroundColor: a.color }}
            title={`${a.label}: ${a.percentage}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {method.allocations?.map((a, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {a.percentage}% {a.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Modal tạo phương pháp custom ───────────── */
const CreateMethodModal = ({ onClose, onCreated }) => {
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [icon, setIcon]           = useState('📊');
  const [allocations, setAllocs]  = useState([
    { label: '', percentage: 50, color: '#2563EB' },
    { label: '', percentage: 50, color: '#16A34A' },
  ]);
  const [saving, setSaving]       = useState(false);

  const total = allocations.reduce((s, a) => s + Number(a.percentage), 0);

  const updateAlloc = (i, field, value) => {
    setAllocs(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const addRow = () => {
    if (allocations.length >= 8) return;
    setAllocs(prev => [...prev, { label: '', percentage: 0, color: PRESET_COLORS[prev.length % PRESET_COLORS.length] }]);
  };

  const removeRow = (i) => {
    if (allocations.length <= 2) return;
    setAllocs(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nhập tên phương pháp');
    if (allocations.some(a => !a.label.trim())) return toast.error('Điền đầy đủ tên các khoản');
    if (Math.abs(total - 100) > 0.01) return toast.error(`Tổng phải bằng 100%, hiện tại: ${total}%`);

    setSaving(true);
    try {
      const res = await axiosInstance.post('/v1/spending-methods', { name, description, icon, allocations });
      toast.success('Đã tạo phương pháp mới!');
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Tạo phương pháp mới</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tên & Icon */}
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="input-base text-center text-2xl"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                Tên phương pháp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Quy tắc 40/40/20"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mô tả (tuỳ chọn)</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              className="input-base resize-none"
              placeholder="Mô tả ngắn về phương pháp này..."
            />
          </div>

          {/* Allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Phân bổ <span className={`font-bold ${Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                  (Tổng: {total}%)
                </span>
              </label>
              <button onClick={addRow} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                <Plus className="w-3 h-3" /> Thêm khoản
              </button>
            </div>
            <div className="space-y-2">
              {allocations.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={a.color}
                    onChange={e => updateAlloc(i, 'color', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={a.label}
                    onChange={e => updateAlloc(i, 'label', e.target.value)}
                    placeholder="Tên khoản..."
                    className="input-base flex-1 py-1.5 text-sm"
                  />
                  <div className="relative w-20 flex-shrink-0">
                    <input
                      type="number"
                      value={a.percentage}
                      onChange={e => updateAlloc(i, 'percentage', Number(e.target.value))}
                      min={1} max={99}
                      className="input-base text-right pr-5 py-1.5 text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                  <button
                    onClick={() => removeRow(i)}
                    disabled={allocations.length <= 2}
                    className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Tạo phương pháp'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Trang chính ────────────────── */
const SpendingStrategyPage = () => {
  const { expenseCategories, fetchBudgets, wallets } = useTransactionStore();

  const [methods, setMethods]             = useState([]);
  const [selected, setSelected]           = useState(null);
  const [income, setIncome]               = useState('');
  const [selectedWalletIds, setSelectedWalletIds] = useState([]);  // Ví được chọn làm nguồn
  const [mappings, setMappings]           = useState({});   // { allocationLabel: categoryId }
  const [loading, setLoading]             = useState(true);
  const [applying, setApplying]           = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [step, setStep]                   = useState(1);    // 1=chọn pp, 2=cấu hình

  const month = dayjs().month() + 1;
  const year  = dayjs().year();

  useEffect(() => { fetchMethods(); }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/v1/spending-methods');
      setMethods(res.data.data || []);
    } catch { toast.error('Không thể tải danh sách phương pháp'); }
    finally  { setLoading(false); }
  };

  const handleSelect = (m) => {
    setSelected(m);
    setMappings({});
  };

  // Tính tổng số dư từ các ví đã chọn
  const walletsTotal = useMemo(() =>
    wallets.filter(w => selectedWalletIds.includes(w.id)).reduce((s, w) => s + w.balance, 0)
  , [selectedWalletIds, wallets]);

  // Khi chọn ví, tự động gợi ý số tiền (nhưng không ghi đè nếu người dùng đã tự nhập)
  const toggleWallet = (walletId) => {
    setSelectedWalletIds(prev => {
      const next = prev.includes(walletId)
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId];
      // Tính lại tổng số dư ví mới
      const total = wallets.filter(w => next.includes(w.id)).reduce((s, w) => s + w.balance, 0);
      setIncome(total > 0 ? String(Math.round(total)) : '');
      return next;
    });
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/v1/spending-methods/${id}`);
      setMethods(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Đã xoá phương pháp');
    } catch { toast.error('Không thể xoá'); }
  };

  const handleCreated = (newMethod) => {
    setMethods(prev => [...prev, newMethod]);
    setSelected(newMethod);
  };

  // Tính toán preview số tiền
  const incomeNum = parseFloat(income.replace(/[^\d]/g, '')) || 0;
  const preview = useMemo(() => {
    if (!selected || !incomeNum) return [];
    return (selected.allocations || []).map(a => ({
      ...a,
      amount: Math.round((Number(a.percentage) / 100) * incomeNum),
    }));
  }, [selected, incomeNum]);

  const handleApply = async () => {
    if (!selected) return toast.error('Chọn phương pháp trước');
    if (!incomeNum) return toast.error('Nhập hoặc chọn ví để có số tiền phân bổ');

    const categoryMappings = Object.entries(mappings)
      .filter(([, catId]) => catId)
      .map(([allocationLabel, categoryId]) => ({ allocationLabel, categoryId }));

    if (categoryMappings.length === 0) return toast.error('Vui lòng ánh xạ ít nhất 1 danh mục');

    setApplying(true);
    try {
      const res = await axiosInstance.post('/v1/spending-methods/apply', {
        methodId: selected.id,
        monthlyIncome: incomeNum,
        month, year,
        categoryMappings,
        walletIds: selectedWalletIds,   // Gửi kèm danh sách ví
      });
      toast.success(`Đã tạo ${res.data.data.length} ngân sách thành công! 🎉`);
      await fetchBudgets();
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Áp dụng thất bại');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Chiến lược phân bổ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Chọn quy tắc và áp dụng làm ngân sách tháng {month}/{year}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo phương pháp mới
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: 'Chọn phương pháp' },
          { n: 2, label: 'Cấu hình & Áp dụng' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
            <div
              onClick={() => s.n < step || selected ? setStep(s.n) : null}
              className={[
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                step === s.n
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === s.n ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'}`}>
                {s.n}
              </span>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Step 1: Chọn phương pháp ── */}
      {step === 1 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map(m => (
              <MethodCard
                key={m.id}
                method={m}
                selected={selected?.id === m.id}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {selected && (
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Tiếp theo: Cấu hình <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {methods.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm">Chưa có phương pháp nào. Hãy tạo phương pháp đầu tiên!</p>
            </div>
          )}
        </>
      )}

      {/* ── Step 2: Cấu hình & Áp dụng ── */}
      {step === 2 && selected && (
        <div className="space-y-5">
          {/* ── Chọn ví nguồn + nhập số tiền */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              <Wallet className="inline w-4 h-4 mr-1.5 text-indigo-500" />
              1. Chọn ví nguồn — Tổng số dư sẽ là cơ sở phân bổ
            </h2>

            {/* Wallet chips */}
            <div className="flex flex-wrap gap-2">
              {wallets.length === 0 && (
                <p className="text-xs text-slate-400">Chưa có ví nào. Hãy tạo ví trong trang Ví & Tài khoản.</p>
              )}
              {wallets.map((w) => {
                const isSel = selectedWalletIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWallet(w.id)}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                      isSel
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300',
                    ].join(' ')}
                  >
                    {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: w.color || '#2563eb' }} />
                    <span>{w.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className={isSel ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                      {formatCurrency(w.balance)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Banner tổng số dư */}
            {selectedWalletIds.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Tổng số dư {selectedWalletIds.length} ví:
                </span>
                <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(walletsTotal)}
                </span>
              </div>
            )}

            {/* 2. Số tiền phân bổ (tùy chỉnh được) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                2. Số tiền cần phân bổ tháng {month}/{year}
                <span className="ml-1 font-normal text-slate-400">(tự điền từ ví — có thể điều chỉnh)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={income ? Number(income.replace(/[^\d]/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setIncome(raw);
                  }}
                  placeholder="VD: 15.000.000 — hoặc chọn ví ở trên"
                  className="input-base pr-10 text-lg font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">đ</span>
              </div>
            </div>
          </div>

          {/* Preview phân bổ */}
          {incomeNum > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                📊 Xem trước phân bổ — {selected.name}
              </h2>
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                {/* Pie */}
                <div className="w-full sm:w-48 h-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={preview} dataKey="percentage" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {preview.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend + số tiền */}
                <div className="flex-1 space-y-2 w-full">
                  {preview.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.label}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white ml-2 flex-shrink-0">
                            {formatCurrency(a.amount)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${a.percentage}%`, backgroundColor: a.color }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{a.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ánh xạ danh mục */}
          {incomeNum > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ánh xạ vào danh mục ngân sách</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Chọn danh mục tương ứng cho mỗi khoản phân bổ. Bỏ trống nếu không muốn tạo ngân sách cho khoản đó.</p>
              <div className="space-y-3">
                {(selected.allocations || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        {a.label}
                        <span className="ml-2 font-normal text-slate-400">
                          ({a.percentage}% = {formatCurrency(Math.round((Number(a.percentage)/100) * incomeNum))})
                        </span>
                      </p>
                    </div>
                    <select
                      value={mappings[a.label] || ''}
                      onChange={e => setMappings(prev => ({ ...prev, [a.label]: e.target.value }))}
                      className="select-base max-w-[180px] text-xs py-1.5"
                    >
                      <option value="">-- Bỏ qua --</option>
                      {expenseCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !incomeNum}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {applying ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang áp dụng...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Áp dụng làm ngân sách tháng {month}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal tạo phương pháp */}
      {showCreate && (
        <CreateMethodModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default SpendingStrategyPage;
