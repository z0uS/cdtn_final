// constants/categories.js
// Danh mục mặc định (không thể xóa), kèm icon và màu

export const EXPENSE_CATEGORIES = [
  { id: 'food',          name: 'Ăn uống',        icon: 'UtensilsCrossed', color: '#f97316', bgColor: '#fff7ed', isDefault: true },
  { id: 'transport',     name: 'Di chuyển',       icon: 'Car',            color: '#06b6d4', bgColor: '#ecfeff', isDefault: true },
  { id: 'shopping',      name: 'Mua sắm',         icon: 'ShoppingBag',    color: '#8b5cf6', bgColor: '#f5f3ff', isDefault: true },
  { id: 'health',        name: 'Sức khỏe',        icon: 'HeartPulse',     color: '#ef4444', bgColor: '#fef2f2', isDefault: true },
  { id: 'entertainment', name: 'Giải trí',        icon: 'Gamepad2',       color: '#ec4899', bgColor: '#fdf2f8', isDefault: true },
  { id: 'education',     name: 'Học tập',         icon: 'GraduationCap',  color: '#3b82f6', bgColor: '#eff6ff', isDefault: true },
  { id: 'bills',         name: 'Hóa đơn',         icon: 'Receipt',        color: '#64748b', bgColor: '#f8fafc', isDefault: true },
  { id: 'housing',       name: 'Nhà ở',           icon: 'Home',           color: '#0ea5e9', bgColor: '#f0f9ff', isDefault: true },
  { id: 'beauty',        name: 'Làm đẹp',         icon: 'Sparkles',       color: '#d946ef', bgColor: '#fdf4ff', isDefault: true },
  { id: 'pet',           name: 'Thú cưng',        icon: 'PawPrint',       color: '#78716c', bgColor: '#fafaf9', isDefault: true },
  { id: 'travel',        name: 'Du lịch',         icon: 'Plane',          color: '#10b981', bgColor: '#f0fdf4', isDefault: true },
  { id: 'other_expense', name: 'Khác',            icon: 'MoreHorizontal', color: '#94a3b8', bgColor: '#f8fafc', isDefault: true },
];

export const INCOME_CATEGORIES = [
  { id: 'salary',        name: 'Lương',           icon: 'Banknote',       color: '#16a34a', bgColor: '#f0fdf4', isDefault: true },
  { id: 'freelance',     name: 'Freelance',       icon: 'Laptop',         color: '#2563eb', bgColor: '#eff6ff', isDefault: true },
  { id: 'investment',    name: 'Đầu tư',          icon: 'TrendingUp',     color: '#0891b2', bgColor: '#ecfeff', isDefault: true },
  { id: 'bonus',         name: 'Thưởng',          icon: 'Gift',           color: '#f59e0b', bgColor: '#fffbeb', isDefault: true },
  { id: 'rental',        name: 'Cho thuê',        icon: 'Building2',      color: '#7c3aed', bgColor: '#f5f3ff', isDefault: true },
  { id: 'other_income',  name: 'Khác',            icon: 'PlusCircle',     color: '#94a3b8', bgColor: '#f8fafc', isDefault: true },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryById = (id) =>
  ALL_CATEGORIES.find((c) => c.id === id) || {
    id: 'other_expense',
    name: 'Khác',
    icon: 'MoreHorizontal',
    color: '#94a3b8',
    bgColor: '#f8fafc',
  };
