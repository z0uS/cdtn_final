// components/ui/AmountInput.jsx
// Input số tiền với format tự động (1.234.567 ₫)

import { useState, useEffect } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatCurrency';

const AmountInput = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  error,
  label,
  required,
  currency = '₫',
  ...props
}) => {
  const [display, setDisplay] = useState('');

  // Sync display khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplay(value ? formatCurrencyInput(String(value)) : '');
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const numValue = Number(raw) || 0;
    setDisplay(raw ? formatCurrencyInput(raw) : '');
    onChange?.(numValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-expense-600">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          className={[
            'input-base pr-8',
            error ? 'border-expense-400 focus:ring-expense-500/30 focus:border-expense-400' : '',
            className,
          ].join(' ')}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">
          {currency}
        </span>
      </div>
      {error && (
        <p className="mt-1 text-xs text-expense-600">{error}</p>
      )}
    </div>
  );
};

export default AmountInput;
