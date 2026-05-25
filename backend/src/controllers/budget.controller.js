// src/controllers/budget.controller.js
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { getCurrentMonthYear } from '../utils/dateHelper.js';

// ── GET /budgets ─────────────────────────────────────────────
export const getBudgets = async (req, res, next) => {
  try {
    const { month: qMonth, year: qYear } = req.query;
    const { month, year } = getCurrentMonthYear();

    const m = parseInt(qMonth) || month;
    const y = parseInt(qYear)  || year;

    const [rows] = await query(
      `SELECT b.*,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         COALESCE((
           SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND MONTH(t.transaction_date) = b.month
             AND YEAR(t.transaction_date)  = b.year
         ), 0) AS amount_spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       ORDER BY c.name ASC`,
      [req.user.id, m, y],
    );

    const enriched = rows.map((b) => ({
      ...b,
      amount_spent:  parseFloat(b.amount_spent),
      percent_used:  b.amount_limit > 0
        ? Math.round((parseFloat(b.amount_spent) / parseFloat(b.amount_limit)) * 100)
        : 0,
      // Parse account_ids JSON (stored as JSON array string in DB)
      account_ids: b.account_ids
        ? (typeof b.account_ids === 'string' ? JSON.parse(b.account_ids) : b.account_ids)
        : [],
    }));

    return success(res, enriched);
  } catch (err) { next(err); }
};

// ── POST /budgets ────────────────────────────────────────────
// UPSERT: nếu đã có ngân sách tháng đó thì cập nhật
export const createBudget = async (req, res, next) => {
  try {
    const { category_id, amount_limit, month: qMonth, year: qYear, account_ids } = req.body;
    const { month, year } = getCurrentMonthYear();
    const m = parseInt(qMonth) || month;
    const y = parseInt(qYear)  || year;

    // account_ids: array of account IDs, e.g. [1, 3]
    const accountIdsJson = Array.isArray(account_ids) && account_ids.length > 0
      ? JSON.stringify(account_ids.map(Number))
      : null;

    await query(
      `INSERT INTO budgets (user_id, category_id, amount_limit, month, year, account_ids)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_limit = VALUES(amount_limit), account_ids = VALUES(account_ids)`,
      [req.user.id, category_id, parseFloat(amount_limit), m, y, accountIdsJson],
    );

    const [rows] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.category_id = ? AND b.month = ? AND b.year = ?`,
      [req.user.id, category_id, m, y],
    );

    const row = rows[0];
    return success(res, {
      ...row,
      account_ids: row.account_ids
        ? (typeof row.account_ids === 'string' ? JSON.parse(row.account_ids) : row.account_ids)
        : [],
    }, 'Tạo/cập nhật ngân sách thành công!', 201);
  } catch (err) { next(err); }
};

// ── PUT /budgets/:id ─────────────────────────────────────────
export const updateBudget = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing.length) return error(res, 'Không tìm thấy ngân sách.', 404);

    const { amount_limit, account_ids } = req.body;

    // Build dynamic update
    const updates = [];
    const values  = [];
    if (amount_limit !== undefined) {
      updates.push('amount_limit = ?');
      values.push(parseFloat(amount_limit));
    }
    if (account_ids !== undefined) {
      updates.push('account_ids = ?');
      values.push(Array.isArray(account_ids) && account_ids.length > 0
        ? JSON.stringify(account_ids.map(Number))
        : null);
    }
    if (updates.length === 0) return error(res, 'Không có dữ liệu cần cập nhật.', 400);

    values.push(req.params.id);
    await query(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await query('SELECT * FROM budgets WHERE id = ?', [req.params.id]);
    const row = rows[0];
    return success(res, {
      ...row,
      account_ids: row.account_ids
        ? (typeof row.account_ids === 'string' ? JSON.parse(row.account_ids) : row.account_ids)
        : [],
    }, 'Cập nhật ngân sách thành công!');
  } catch (err) { next(err); }
};

// ── DELETE /budgets/:id ──────────────────────────────────────
export const deleteBudget = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing.length) return error(res, 'Không tìm thấy ngân sách.', 404);

    await query('DELETE FROM budgets WHERE id = ?', [req.params.id]);
    return success(res, null, 'Xóa ngân sách thành công!');
  } catch (err) { next(err); }
};
