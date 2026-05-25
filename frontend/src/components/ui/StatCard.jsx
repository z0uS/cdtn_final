// components/ui/StatCard.jsx
// Thẻ thống kê số liệu với icon, label, % thay đổi

import { TrendingUp, TrendingDown } from 'lucide-react';
import * as Icons from 'lucide-react';

const StatCard = ({
  label,
  value,
  icon,
  iconColor = 'text-primary-600',
  iconBg   = 'bg-primary-50',
  change,          // số % thay đổi (+ thu, - chi)
  changeLabel = 'so với tháng trước',
  loading = false,
  className = '',
}) => {
  const LucideIcon = icon ? Icons[icon] : null;
  const isPositive = change >= 0;

  if (loading) {
    return (
      <div className={`card p-5 animate-pulse-soft ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div className="w-16 h-4 rounded bg-slate-100 dark:bg-slate-700" />
        </div>
        <div className="w-32 h-7 rounded bg-slate-100 dark:bg-slate-700 mb-1" />
        <div className="w-24 h-3 rounded bg-slate-100 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className={`card p-5 hover:shadow-card-md transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {LucideIcon && (
          <div className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <LucideIcon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-income-600' : 'text-expense-600'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className="mt-1">
        <p className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
        {change !== undefined && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
