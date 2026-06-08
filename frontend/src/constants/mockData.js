// constants/mockData.js
// Dữ liệu giả để phát triển frontend – thay bằng API thật sau

import dayjs from 'dayjs';

// ── WALLETS ──────────────────────────────────────────────
export const MOCK_WALLETS = [
  { id: 'w1', name: 'Tiền mặt',       icon: 'Wallet',    color: '#f59e0b', balance: 1_500_000  },
  { id: 'w2', name: 'Vietcombank',    icon: 'CreditCard', color: '#2563eb', balance: 15_200_000 },
  { id: 'w3', name: 'MoMo',           icon: 'Smartphone', color: '#a855f7', balance: 3_400_000  },
  { id: 'w4', name: 'Techcombank',    icon: 'Building2',  color: '#0ea5e9', balance: 8_700_000  },
];

// ── USER ─────────────────────────────────────────────────
export const MOCK_USER = {
  id:       'u1',
  name:     'Nguyễn Văn An',
  email:    'an.nguyen@email.com',
  avatar:   null,
  currency: 'VND',
  createdAt: '2024-01-15',
};

// ── TRANSACTIONS ─────────────────────────────────────────
const today = dayjs();
export const MOCK_TRANSACTIONS = [
  // Tháng này
  { id: 't01', type: 'expense', amount: 85_000,     categoryId: 'food',          walletId: 'w1', description: 'Cơm trưa văn phòng',         date: today.subtract(0, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't02', type: 'expense', amount: 350_000,    categoryId: 'shopping',      walletId: 'w2', description: 'Mua áo H&M',                 date: today.subtract(1, 'day').format('YYYY-MM-DD'),  note: 'Sale 30%' },
  { id: 't03', type: 'income',  amount: 12_000_000, categoryId: 'salary',        walletId: 'w2', description: 'Lương tháng 4',               date: today.subtract(1, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't04', type: 'expense', amount: 200_000,    categoryId: 'transport',     walletId: 'w3', description: 'Grab đi làm cả tuần',         date: today.subtract(2, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't05', type: 'expense', amount: 1_200_000,  categoryId: 'bills',         walletId: 'w2', description: 'Tiền điện tháng 4',           date: today.subtract(2, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't06', type: 'expense', amount: 450_000,    categoryId: 'entertainment', walletId: 'w1', description: 'Netflix + Spotify',           date: today.subtract(3, 'day').format('YYYY-MM-DD'),  note: 'Gia hạn 3 tháng' },
  { id: 't07', type: 'income',  amount: 2_500_000,  categoryId: 'freelance',     walletId: 'w2', description: 'Dự án thiết kế web',          date: today.subtract(3, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't08', type: 'expense', amount: 120_000,    categoryId: 'food',          walletId: 'w1', description: 'Coffee với khách hàng',       date: today.subtract(4, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't09', type: 'expense', amount: 800_000,    categoryId: 'health',        walletId: 'w2', description: 'Khám sức khỏe định kỳ',       date: today.subtract(4, 'day').format('YYYY-MM-DD'),  note: 'Bệnh viện FV' },
  { id: 't10', type: 'expense', amount: 3_000_000,  categoryId: 'housing',       walletId: 'w2', description: 'Tiền thuê nhà tháng 4',       date: today.subtract(5, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't11', type: 'expense', amount: 250_000,    categoryId: 'food',          walletId: 'w3', description: 'Đi ăn sinh nhật bạn',         date: today.subtract(5, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't12', type: 'income',  amount: 500_000,    categoryId: 'bonus',         walletId: 'w2', description: 'Thưởng hoàn thành dự án',     date: today.subtract(6, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't13', type: 'expense', amount: 650_000,    categoryId: 'shopping',      walletId: 'w2', description: 'Mua đồ dùng gia đình',        date: today.subtract(7, 'day').format('YYYY-MM-DD'),  note: 'IKEA' },
  { id: 't14', type: 'expense', amount: 90_000,     categoryId: 'food',          walletId: 'w1', description: 'Bún bò Huế',                  date: today.subtract(7, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't15', type: 'expense', amount: 180_000,    categoryId: 'education',     walletId: 'w2', description: 'Mua sách Atomic Habits',      date: today.subtract(8, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't16', type: 'expense', amount: 300_000,    categoryId: 'beauty',        walletId: 'w3', description: 'Cắt tóc + dưỡng da',         date: today.subtract(9, 'day').format('YYYY-MM-DD'),  note: '' },
  { id: 't17', type: 'income',  amount: 1_000_000,  categoryId: 'investment',    walletId: 'w4', description: 'Cổ tức chứng khoán',          date: today.subtract(10,'day').format('YYYY-MM-DD'), note: '' },
  { id: 't18', type: 'expense', amount: 500_000,    categoryId: 'travel',        walletId: 'w2', description: 'Đặt vé xe đi Đà Lạt',        date: today.subtract(11,'day').format('YYYY-MM-DD'), note: '' },
  { id: 't19', type: 'expense', amount: 150_000,    categoryId: 'food',          walletId: 'w1', description: 'Đặt đồ ăn Baemin',           date: today.subtract(12,'day').format('YYYY-MM-DD'), note: '' },
  { id: 't20', type: 'expense', amount: 400_000,    categoryId: 'transport',     walletId: 'w2', description: 'Đổ xăng xe máy',             date: today.subtract(13,'day').format('YYYY-MM-DD'), note: '' },
];

// ── BUDGETS ──────────────────────────────────────────────
export const MOCK_BUDGETS = [
  { id: 'b1', categoryId: 'food',          limit: 3_000_000, period: 'month', month: today.format('YYYY-MM') },
  { id: 'b2', categoryId: 'shopping',      limit: 2_000_000, period: 'month', month: today.format('YYYY-MM') },
  { id: 'b3', categoryId: 'transport',     limit: 1_000_000, period: 'month', month: today.format('YYYY-MM') },
  { id: 'b4', categoryId: 'entertainment', limit: 500_000,   period: 'month', month: today.format('YYYY-MM') },
  { id: 'b5', categoryId: 'health',        limit: 1_500_000, period: 'month', month: today.format('YYYY-MM') },
  { id: 'b6', categoryId: 'education',     limit: 800_000,   period: 'month', month: today.format('YYYY-MM') },
  { id: 'b7', categoryId: 'bills',         limit: 2_000_000, period: 'month', month: today.format('YYYY-MM') },
];

// ── CHART DATA – 7 ngày gần nhất ─────────────────────────
export const MOCK_DAILY_CHART = Array.from({ length: 7 }, (_, i) => {
  const date = today.subtract(6 - i, 'day');
  return {
    date: date.format('DD/MM'),
    thu:  Math.floor(Math.random() * 3_000_000 + 500_000),
    chi:  Math.floor(Math.random() * 2_000_000 + 200_000),
  };
});

// ── CHART DATA – 12 tháng ─────────────────────────────────
export const MOCK_MONTHLY_CHART = Array.from({ length: 12 }, (_, i) => {
  const month = today.subtract(11 - i, 'month');
  return {
    month: month.format('MM/YY'),
    thu:   Math.floor(Math.random() * 5_000_000 + 10_000_000),
    chi:   Math.floor(Math.random() * 4_000_000 + 6_000_000),
  };
});

// ── CREDENTIALS GIẢ để test đăng nhập ───────────────────
export const MOCK_CREDENTIALS = {
  email:    'an.nguyen@email.com',
  password: '123456',
  token:    'mock_jwt_token_12345',
};
