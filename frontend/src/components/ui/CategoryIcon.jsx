// components/ui/CategoryIcon.jsx
// Hiển thị icon và màu của danh mục

import * as Icons from 'lucide-react';

const sizes = {
  xs:  { wrapper: 'w-6 h-6 rounded-lg',  icon: 'w-3 h-3' },
  sm:  { wrapper: 'w-8 h-8 rounded-xl',  icon: 'w-4 h-4' },
  md:  { wrapper: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  lg:  { wrapper: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
};

const CategoryIcon = ({ category, size = 'md', className = '' }) => {
  if (!category) return null;

  const LucideIcon = Icons[category.icon] || Icons.MoreHorizontal;
  const { wrapper, icon } = sizes[size] || sizes.md;

  return (
    <div
      className={`${wrapper} flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: category.bgColor || '#f1f5f9' }}
    >
      <LucideIcon
        className={icon}
        style={{ color: category.color || '#64748b' }}
      />
    </div>
  );
};

export default CategoryIcon;
