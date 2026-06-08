// components/ui/EmptyState.jsx
// Trạng thái rỗng khi không có dữ liệu

import { PackageOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Chưa có dữ liệu',
  description = 'Thêm dữ liệu mới để bắt đầu theo dõi.',
  action,
  actionLabel,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
      {title}
    </h3>
    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-6">
      {description}
    </p>
    {action && actionLabel && (
      <Button variant="primary" size="sm" onClick={action}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
