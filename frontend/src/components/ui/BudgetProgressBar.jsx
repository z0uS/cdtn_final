// components/ui/BudgetProgressBar.jsx
// Thanh tiến độ ngân sách với màu cảnh báo

import useTransactionStore from '../../store/transactionStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { calcPercent } from '../../utils/calcPercent';
import CategoryIcon from './CategoryIcon';
import { AlertTriangle } from 'lucide-react';

const BudgetProgressBar = ({ budget, spent = 0, compact = false }) => {
  const { expenseCategories, incomeCategories } = useTransactionStore();
  const getCategoryById = (id) => expenseCategories.find(c => c.id === id) || incomeCategories.find(c => c.id === id) || { name: 'Khác', icon: 'QuestionMark' };
  const category = getCategoryById(budget.categoryId);
  const percent  = calcPercent(spent, budget.limit);
  const isWarning  = percent >= 80 && percent < 100;
  const isExceeded = percent >= 100;

  const barColor = isExceeded
    ? 'bg-expense-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-primary-500';

  const textColor = isExceeded
    ? 'text-expense-600'
    : isWarning
    ? 'text-amber-600'
    : 'text-primary-600';

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <CategoryIcon category={category} size="xs" />
            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px]">
              {category.name}
            </span>
          </div>
          <span className={`font-semibold ${textColor}`}>{percent}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3 hover:shadow-card-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CategoryIcon category={category} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {category.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatCurrency(spent)} / {formatCurrency(budget.limit)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${textColor}`}>{percent}%</p>
          {(isWarning || isExceeded) && (
            <div className={`flex items-center gap-1 text-xs ${textColor} mt-0.5`}>
              <AlertTriangle className="w-3 h-3" />
              {isExceeded ? 'Vượt hạn mức!' : 'Gần hết hạn mức'}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Remaining */}
      {!isExceeded && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Còn lại: <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency(Math.max(budget.limit - spent, 0))}
          </span>
        </p>
      )}
    </div>
  );
};

export default BudgetProgressBar;
