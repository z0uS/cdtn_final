// pages/ReportsPage.jsx
// Báo cáo & Thống kê: biểu đồ đa dạng, chọn kỳ báo cáo

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react';
import useTransactionStore from '../store/transactionStore';
import { formatCurrency }  from '../utils/formatCurrency';
import { sumBy, groupBy, calcSavingsRate } from '../utils/calcPercent';
import { MOCK_MONTHLY_CHART } from '../constants/mockData';
import StatCard from '../components/ui/StatCard';
import CategoryIcon from '../components/ui/CategoryIcon';
import dayjs from 'dayjs';

const CHART_COLORS = [
  '#2563eb','#f97316','#8b5cf6','#06b6d4','#ec4899',
  '#10b981','#f59e0b','#64748b','#ef4444',
];

const PERIOD_OPTIONS = [
  { value: 'week',    label: '7 ngày'   },
  { value: 'month',   label: 'Tháng này'},
  { value: 'quarter', label: 'Quý này'  },
  { value: 'year',    label: 'Năm này'  },
  { value: 'custom',  label: 'Tùy chọn' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-card-lg border border-slate-100 dark:border-slate-700 p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name === 'thu' ? 'Thu nhập' : 'Chi tiêu'}:</span>
          <span className="font-semibold">{formatCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  );
};

const ReportsPage = () => {
  const { transactions, expenseCategories, incomeCategories } = useTransactionStore();

  const getCategoryById = (id) => expenseCategories.find(c => c.id === Number(id)) || incomeCategories.find(c => c.id === Number(id)) || { name: 'Khác', icon: 'MoreHorizontal', color: '#94a3b8' };

  const [period, setPeriod] = useState('month');

  // Custom date range state
  const today = dayjs().format('YYYY-MM-DD');
  const [customStart, setCustomStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customEnd,   setCustomEnd]   = useState(today);
  const [customError, setCustomError] = useState('');

  const handleCustomStart = (val) => {
    setCustomStart(val);
    if (customEnd && val) {
      const diff = dayjs(customEnd).diff(dayjs(val), 'day');
      if (diff < 0)  setCustomError('Ngày bắt đầu phải trước ngày kết thúc.');
      else if (diff > 30) setCustomError('Khoảng thời gian tối đa là 31 ngày.');
      else setCustomError('');
    }
  };

  const handleCustomEnd = (val) => {
    setCustomEnd(val);
    if (customStart && val) {
      const diff = dayjs(val).diff(dayjs(customStart), 'day');
      if (diff < 0)  setCustomError('Ngày bắt đầu phải trước ngày kết thúc.');
      else if (diff > 30) setCustomError('Khoảng thời gian tối đa là 31 ngày.');
      else setCustomError('');
    }
  };

  // Tính khoảng thời gian
  const dateRange = useMemo(() => {
    const now = dayjs();
    switch (period) {
      case 'week':    return { start: now.subtract(6, 'day'),   end: now };
      case 'month':   return { start: now.startOf('month'),     end: now.endOf('month') };
      case 'quarter': return { start: now.startOf('quarter'),   end: now.endOf('quarter') };
      case 'year':    return { start: now.startOf('year'),      end: now.endOf('year') };
      case 'custom':  return { start: dayjs(customStart),       end: dayjs(customEnd) };
      default:        return { start: now.startOf('month'),     end: now.endOf('month') };
    }
  }, [period, customStart, customEnd]);

  // Lọc giao dịch theo kỳ
  const filteredTxs = useMemo(() => {
    const { start, end } = dateRange;
    return transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.isAfter(start.subtract(1, 'day')) && d.isBefore(end.add(1, 'day'));
    });
  }, [transactions, dateRange]);

  const totalIncome  = useMemo(() => sumBy(filteredTxs.filter((t) => t.type === 'income'),  'amount'), [filteredTxs]);
  const totalExpense = useMemo(() => sumBy(filteredTxs.filter((t) => t.type === 'expense'), 'amount'), [filteredTxs]);
  const savings      = totalIncome - totalExpense;
  const savingsRate  = calcSavingsRate(totalIncome, totalExpense);

  // Pie: chi theo danh mục
  const expenseByCategory = useMemo(() => {
    const expTxs  = filteredTxs.filter((t) => t.type === 'expense');
    const grouped = groupBy(expTxs, 'categoryId');
    return Object.entries(grouped)
      .map(([catId, txs]) => ({
        name:  getCategoryById(catId).name,
        value: sumBy(txs, 'amount'),
        color: getCategoryById(catId).color,
        catId,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  const top5 = expenseByCategory.slice(0, 5);

  // Tính dữ liệu biểu đồ 6 tháng gần nhất từ dữ liệu thực
  const monthlyChartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month');
      const mStart = d.startOf('month');
      const mEnd = d.endOf('month');
      
      const txsInMonth = transactions.filter(t => {
        const tDate = dayjs(t.date);
        return tDate.isAfter(mStart.subtract(1, 'day')) && tDate.isBefore(mEnd.add(1, 'day'));
      });
      
      const thu = sumBy(txsInMonth.filter(t => t.type === 'income'), 'amount');
      const chi = sumBy(txsInMonth.filter(t => t.type === 'expense'), 'amount');
      
      data.push({
        month: d.format('MM/YY'),
        thu,
        chi
      });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-5">
      {/* Header + Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Báo cáo & Thống kê</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dateRange.start.format('DD/MM/YYYY')} – {dateRange.end.format('DD/MM/YYYY')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={[
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                period === value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range inputs */}
      {period === 'custom' && (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Từ ngày</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || today}
                onChange={(e) => handleCustomStart(e.target.value)}
                className="input-base text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Đến ngày</label>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={today}
                onChange={(e) => handleCustomEnd(e.target.value)}
                className="input-base text-sm"
              />
            </div>
            {customError && (
              <p className="text-xs text-expense-600 font-medium">{customError}</p>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng thu nhập" value={formatCurrency(totalIncome, true)} icon="TrendingUp" iconColor="text-income-600" iconBg="bg-income-50" />
        <StatCard label="Tổng chi tiêu" value={formatCurrency(totalExpense, true)} icon="TrendingDown" iconColor="text-expense-600" iconBg="bg-expense-50" />
        <StatCard label="Tiết kiệm" value={formatCurrency(savings, true)} icon="PiggyBank" iconColor="text-primary-600" iconBg="bg-primary-50" />
        <StatCard label="Tỷ lệ tiết kiệm" value={`${savingsRate}%`} icon="Percent" iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Bar chart – thu vs chi */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Thu nhập vs Chi tiêu theo tháng</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(val) => <span style={{ fontSize: 12, color: '#64748b' }}>{val === 'thu' ? 'Thu nhập' : 'Chi tiêu'}</span>}
            />
            <Bar dataKey="thu" name="thu" fill="#16a34a" radius={[4,4,0,0]} maxBarSize={30} />
            <Bar dataKey="chi" name="chi" fill="#dc2626" radius={[4,4,0,0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart – xu hướng */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Xu hướng chi tiêu</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatCurrency(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="thu" name="thu" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="chi" name="chi" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Cơ cấu chi tiêu</h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%" cy="45%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Không có dữ liệu chi tiêu
            </div>
          )}
        </div>
      </div>

      {/* Top 5 danh mục */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">
          Top {top5.length} danh mục chi tiêu nhiều nhất
        </h2>
        {top5.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Không có dữ liệu trong kỳ này</p>
        ) : (
          <div className="space-y-3">
            {top5.map((item, i) => {
              const cat     = getCategoryById(item.catId);
              const percent = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
              return (
                <div key={item.catId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                  <CategoryIcon category={cat} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="text-sm font-semibold text-expense-600">{formatCurrency(item.value, true)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%`, background: cat.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{percent}% tổng chi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
