// store/transactionStore.js
// Zustand store kết nối với backend API

import { create } from 'zustand';
import dayjs from 'dayjs';

import { 
  getTransactionsApi, createTransactionApi, updateTransactionApi, deleteTransactionApi 
} from '../api/transactionApi';
import { 
  getBudgetsApi, createBudgetApi, updateBudgetApi, deleteBudgetApi 
} from '../api/budgetApi';
import { 
  getAccountsApi, createAccountApi, updateAccountApi, deleteAccountApi 
} from '../api/accountApi';
import { 
  getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi 
} from '../api/categoryApi';

const useTransactionStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────
  transactions:       [],
  budgets:            [],
  wallets:            [],
  expenseCategories:  [],
  incomeCategories:   [],
  isLoading:          false,
  error:              null,

  // ── FETCH INITIAL DATA ──────────────────────────────────
  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchWallets(),
        get().fetchCategories(),
        get().fetchBudgets(),
        get().fetchTransactions()
      ]);
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const res = await getTransactionsApi({ limit: 500 });
      const mapped = (res.data || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        categoryId: t.category_id,
        walletId: t.account_id,
        description: t.description,
        date: dayjs(t.transaction_date).format('YYYY-MM-DD'),
        note: t.note || ''
      }));
      set({ transactions: mapped });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  fetchWallets: async () => {
    try {
      const res = await getAccountsApi();
      const mapped = (res.accounts || []).map(w => ({
        id: w.id,
        name: w.name,
        icon: w.icon || 'Wallet',
        color: w.color || '#2563eb',
        balance: parseFloat(w.balance),
        isDefault: w.is_default === 1
      }));
      set({ wallets: mapped });
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  },

  fetchCategories: async () => {
    try {
      const cats = await getCategoriesApi();
      const mapped = cats.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon || 'QuestionMark',
        color: c.color || '#64748b',
        isSystem: c.user_id === null
      }));
      set({ 
        expenseCategories: mapped.filter(c => c.type === 'expense'),
        incomeCategories: mapped.filter(c => c.type === 'income')
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  fetchBudgets: async () => {
    try {
      // Get budgets for current month initially
      const today = dayjs();
      const buds = await getBudgetsApi(today.month() + 1, today.year());
      const mapped = buds.map(b => ({
        id: b.id,
        categoryId: b.category_id,
        limit: parseFloat(b.amount_limit),
        period: 'month',
        month: `${b.year}-${String(b.month).padStart(2, '0')}`
      }));
      set({ budgets: mapped });
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  },

  // ── TRANSACTIONS CRUD ───────────────────────────────────
  addTransaction: async (tx) => {
    try {
      await createTransactionApi({
        account_id: tx.walletId,
        category_id: tx.categoryId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        note: tx.note,
        transaction_date: tx.date
      });
      await get().fetchTransactions(); // Refresh
      await get().fetchWallets();      // Refresh balance
    } catch (error) { throw error; }
  },

  updateTransaction: async (id, data) => {
    try {
      const payload = {};
      if (data.walletId) payload.account_id = data.walletId;
      if (data.categoryId) payload.category_id = data.categoryId;
      if (data.type) payload.type = data.type;
      if (data.amount !== undefined) payload.amount = data.amount;
      if (data.description !== undefined) payload.description = data.description;
      if (data.note !== undefined) payload.note = data.note;
      if (data.date) payload.transaction_date = data.date;

      await updateTransactionApi(id, payload);
      await get().fetchTransactions();
      await get().fetchWallets();
    } catch (error) { throw error; }
  },

  deleteTransaction: async (id) => {
    try {
      await deleteTransactionApi(id);
      await get().fetchTransactions();
      await get().fetchWallets(); 
    } catch (error) { throw error; }
  },

  // ── BUDGETS CRUD ────────────────────────────────────────
  addBudget: async (budget) => {
    try {
      const [year, month] = budget.month.split('-');
      await createBudgetApi({
        category_id: budget.categoryId,
        amount_limit: budget.limit,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        account_ids: budget.accountIds || [],   // array of wallet IDs
      });
      await get().fetchBudgets();
    } catch (error) { throw error; }
  },

  updateBudget: async (id, data) => {
    try {
      const payload = {};
      if (data.limit !== undefined) payload.amount_limit = data.limit;
      if (data.accountIds !== undefined) payload.account_ids = data.accountIds;
      await updateBudgetApi(id, payload);
      await get().fetchBudgets();
    } catch (error) { throw error; }
  },

  deleteBudget: async (id) => {
    try {
      await deleteBudgetApi(id);
      await get().fetchBudgets();
    } catch (error) { throw error; }
  },

  // ── WALLETS CRUD ────────────────────────────────────────
  addWallet: async (wallet) => {
    try {
      await createAccountApi({
        name: wallet.name,
        type: 'cash', // Default
        balance: wallet.balance || 0,
        icon: wallet.icon,
        color: wallet.color
      });
      await get().fetchWallets();
    } catch (error) { throw error; }
  },

  updateWallet: async (id, data) => {
    try {
      await updateAccountApi(id, data);
      await get().fetchWallets();
    } catch (error) { throw error; }
  },

  deleteWallet: async (id) => {
    try {
      await deleteAccountApi(id);
      await get().fetchWallets();
    } catch (error) { throw error; }
  },

  // ── CATEGORIES CRUD ─────────────────────────────────────
  addCategory: async (cat, type) => {
    try {
      await createCategoryApi({
        name: cat.name,
        type: type,
        icon: cat.icon,
        color: cat.color
      });
      await get().fetchCategories();
    } catch (error) { throw error; }
  },

  updateCategory: async (id, data, type) => {
    try {
      await updateCategoryApi(id, {
        name: data.name,
        icon: data.icon,
        color: data.color
      });
      await get().fetchCategories();
    } catch (error) { throw error; }
  },

  deleteCategory: async (id, type) => {
    try {
      await deleteCategoryApi(id);
      await get().fetchCategories();
    } catch (error) { throw error; }
  },
}));

export default useTransactionStore;
