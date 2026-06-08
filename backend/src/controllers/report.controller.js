// src/controllers/report.controller.js
import { query, queryRaw } from '../config/db.js';
import { success } from '../utils/response.js';
import { getCurrentMonthYear } from '../utils/dateHelper.js';

// Helper lấy tháng/năm từ query hoặc hiện tại
const getMonthYear = (q) => {
  const { month, year } = getCurrentMonthYear();
  return {
    m: parseInt(q.month) || month,
    y: parseInt(q.year)  || year,
  };
};

// ── GET /reports/summary ─────────────────────────────────────
export const getSummary = async (req, res, next) => {
  try {
    const { m, y } = getMonthYear(req.query);

    const [[row]] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
      [req.user.id, m, y],
    );

    const income  = parseFloat(row.total_income);
    const expense = parseFloat(row.total_expense);
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return success(res, { total_income: income, total_expense: expense, balance, savings_rate: savingsRate, month: m, year: y });
  } catch (err) { next(err); }
};

// ── GET /reports/monthly-chart ───────────────────────────────
export const getMonthlyChart = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || getCurrentMonthYear().year;

    const [rows] = await query(
      `SELECT
         MONTH(transaction_date) AS month,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND YEAR(transaction_date) = ?
       GROUP BY MONTH(transaction_date)
       ORDER BY MONTH(transaction_date)`,
      [req.user.id, year],
    );

    // Đảm bảo đủ 12 tháng (điền 0 cho tháng không có dữ liệu)
    const map = {};
    rows.forEach((r) => { map[r.month] = r; });
    const result = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        income:  parseFloat(map[month]?.income  || 0),
        expense: parseFloat(map[month]?.expense || 0),
      };
    });

    return success(res, result);
  } catch (err) { next(err); }
};

// ── GET /reports/category-breakdown ─────────────────────────
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { m, y }   = getMonthYear(req.query);
    const type = req.query.type || 'expense';

    const [rows] = await query(
      `SELECT
         c.id AS category_id, c.name AS category_name, c.icon, c.color,
         COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = ?
         AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total DESC`,
      [req.user.id, type, m, y],
    );

    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total), 0);
    const result = rows.map((r) => ({
      ...r,
      total:   parseFloat(r.total),
      percent: grandTotal > 0 ? Math.round((parseFloat(r.total) / grandTotal) * 100) : 0,
    }));

    return success(res, result);
  } catch (err) { next(err); }
};

// ── GET /reports/top-categories ──────────────────────────────
export const getTopCategories = async (req, res, next) => {
  try {
    const { m, y } = getMonthYear(req.query);
    const type  = req.query.type  || 'expense';
    const limit = parseInt(req.query.limit) || 5;

    const [rows] = await queryRaw(
      `SELECT
         c.id AS category_id, c.name AS category_name, c.icon, c.color,
         COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = ?
         AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total DESC
       LIMIT ?`,
      [req.user.id, type, m, y, limit],
    );

    return success(res, rows.map((r) => ({ ...r, total: parseFloat(r.total) })));
  } catch (err) { next(err); }
};

// ── GET /reports/daily-chart ─────────────────────────────────
export const getDailyChart = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const { m, y } = getMonthYear(req.query);

    const startDate = start_date || `${y}-${String(m).padStart(2,'0')}-01`;
    const endDate   = end_date   || new Date(y, m, 0).toISOString().split('T')[0];

    const [rows] = await query(
      `SELECT
         DATE(transaction_date) AS date,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ?
         AND transaction_date BETWEEN ? AND ?
       GROUP BY DATE(transaction_date)
       ORDER BY DATE(transaction_date)`,
      [req.user.id, startDate, endDate],
    );

    return success(res, rows.map((r) => ({
      date:    r.date,
      income:  parseFloat(r.income),
      expense: parseFloat(r.expense),
    })));
  } catch (err) { next(err); }
};
