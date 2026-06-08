// components/ui/Button.jsx
// Button component với nhiều variants

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
  danger:    'bg-expense-600 hover:bg-expense-700 text-white shadow-sm',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
  income:    'bg-income-600 hover:bg-income-700 text-white shadow-sm',
  outline:   'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50',
};

const sizes = {
  xs:  'text-xs px-2.5 py-1.5 rounded-lg',
  sm:  'text-sm px-3 py-2 rounded-xl',
  md:  'text-sm px-4 py-2.5 rounded-xl',
  lg:  'text-base px-5 py-3 rounded-xl',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight,
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
      {iconRight && !loading && (
        <iconRight className="w-4 h-4 flex-shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
