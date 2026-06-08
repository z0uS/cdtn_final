// components/ui/LoadingSkeleton.jsx
// Animated skeleton placeholder khi đang tải dữ liệu

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg ${className}`} />
);

// Skeleton cho 1 dòng transaction
export const TransactionRowSkeleton = () => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <div className="space-y-2 text-right">
      <Skeleton className="h-4 w-24 ml-auto" />
      <Skeleton className="h-3 w-16 ml-auto" />
    </div>
  </div>
);

// Skeleton cho StatCard
export const StatCardSkeleton = () => (
  <div className="card p-5 animate-pulse-soft">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-12 h-4" />
    </div>
    <Skeleton className="h-7 w-32 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// Skeleton cho biểu đồ
export const ChartSkeleton = ({ height = 'h-48' }) => (
  <div className={`animate-pulse-soft bg-slate-50 dark:bg-slate-800 rounded-xl ${height} flex items-end justify-around px-6 pb-4 gap-2`}>
    {Array.from({ length: 7 }, (_, i) => (
      <div
        key={i}
        className="bg-slate-200 dark:bg-slate-700 rounded-t-lg flex-1"
        style={{ height: `${30 + Math.random() * 60}%` }}
      />
    ))}
  </div>
);

const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="space-y-1 divide-y divide-slate-50 dark:divide-slate-800">
    {Array.from({ length: rows }, (_, i) => (
      <TransactionRowSkeleton key={i} />
    ))}
  </div>
);

export default LoadingSkeleton;
