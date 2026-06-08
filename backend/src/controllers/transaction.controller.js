// src/controllers/transaction.controller.js
// CRUD giao dịch thu/chi – xử lý cập nhật balance tài khoản

import { query, queryRaw, getConnection } from '../config/db.js';
import { success, error, paginated } from '../utils/response.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

// Helper: tạo notification khi budget vượt 80%
const checkBudgetAndNotify = async (userId, categoryId, connection) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const [budgets] = await connection.execute(
      'SELECT id, amount_limit FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?',
      [userId, categoryId, month, year],
    );
    if (!budgets.length) return;

    const budget = budgets[0];

    const [spentResult] = await connection.execute(
      `SELECT COALESCE(SUM(amount), 0) AS spent
       FROM transactions
       WHERE user_id = ? AND category_id = ? AND type = 'expense'
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
      [userId, categoryId, month, year],
    );
    const spent = parseFloat(spentResult[0].spent);
    const limit = parseFloat(budget.amount_limit);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    if (percent >= 80) {
      const [[cat]] = await connection.execute('SELECT name FROM categories WHERE id = ?', [categoryId]);
      const catName = cat?.name || 'danh mục';
      const msg = percent >= 100
        ? `Bạn đã vượt ngân sách ${catName}! (${Math.round(percent)}% hạn mức)`
        : `Ngân sách ${catName} đã đạt ${Math.round(percent)}% hạn mức. Hãy cân nhắc chi tiêu!`;

      await connection.execute(
        `INSERT INTO notifications (user_id, title, message, type, related_id)
         VALUES (?, ?, ?, 'budget_warning', ?)`,
        [userId, `Cảnh báo ngân sách: ${catName}`, msg, budget.id],
      );
    }
  } catch (_) {/* Không để lỗi notification phá vỡ flow chính */}
};

// ── GET /transactions ────────────────────────────────────────
export const getTransactions = async (req, res, next) => {
  try {
    const {
      type, category_id, account_id,
      start_date, end_date, search,
      page, limit, sort = 'transaction_date:desc',
    } = req.query;

    const { page: p, limit: l, offset } = getPagination(page, limit);

    // Xây dựng WHERE clause
    const conditions = ['t.user_id = ?'];
    const params = [req.user.id];

    if (type     && ['income','expense'].includes(type)) { conditions.push('t.type = ?');            params.push(type); }
    if (category_id) { conditions.push('t.category_id = ?');  params.push(category_id); }
    if (account_id)  { conditions.push('t.account_id = ?');   params.push(account_id); }
    if (start_date)  { conditions.push('t.transaction_date >= ?'); params.push(start_date); }
    if (end_date)    { conditions.push('t.transaction_date <= ?'); params.push(end_date); }
    if (search)      { conditions.push('t.description LIKE ?'); params.push(`%${search}%`); }

    const where = conditions.join(' AND ');

    // Xác định sort
    const [sortField, sortDir] = sort.split(':');
    const allowedSortFields = ['transaction_date', 'amount', 'created_at'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'transaction_date';
    const safeSortDir   = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Count tổng
    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM transactions t WHERE ${where}`,
      params,
    );

    // Lấy dữ liệu (dùng queryRaw vì mysql2 execute() không chấp nhận LIMIT/OFFSET)
    const [rows] = await queryRaw(
      `SELECT t.*,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         a.name AS account_name,  a.icon AS account_icon,  a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts   a ON t.account_id  = a.id
       WHERE ${where}
       ORDER BY t.${safeSortField} ${safeSortDir}, t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, l, offset],
    );

    return paginated(res, rows, buildPagination(total, p, l));
  } catch (err) { next(err); }
};

// ── POST /transactions ───────────────────────────────────────
export const createTransaction = async (req, res, next) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { account_id, category_id, type, amount, description = '', note, image_url, transaction_date } = req.body;
    const userId = req.user.id;

    // Kiểm tra account thuộc user
    const [[account]] = await conn.execute(
      'SELECT id, balance FROM accounts WHERE id = ? AND user_id = ?',
      [account_id, userId],
    );
    if (!account) {
      await conn.rollback(); conn.release();
      return error(res, 'Tài khoản không tồn tại.', 404);
    }

    // Kiểm tra category hợp lệ
    const [[category]] = await conn.execute(
      'SELECT id FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
      [category_id, userId],
    );
    if (!category) {
      await conn.rollback(); conn.release();
      return error(res, 'Danh mục không tồn tại.', 404);
    }

    const parsedAmount = parseFloat(amount);
    const newBalance = type === 'income'
      ? parseFloat(account.balance) + parsedAmount
      : parseFloat(account.balance) - parsedAmount;

    // Tạo giao dịch
    const [result] = await conn.execute(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, image_url, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, account_id, category_id, type, parsedAmount, description, note || null, image_url || null, transaction_date],
    );

    // Cập nhật balance
    await conn.execute('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account_id]);

    // Kiểm tra budget nếu là expense
    if (type === 'expense') {
      await checkBudgetAndNotify(userId, category_id, conn);
    }

    await conn.commit();
    conn.release();

    // Trả về giao dịch vừa tạo kèm thông tin join
    const [[newTx]] = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name, a.icon AS account_icon, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts   a ON t.account_id  = a.id
       WHERE t.id = ?`,
      [result.insertId],
    );

    return success(res, newTx, 'Tạo giao dịch thành công!', 201);
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ── GET /transactions/:id ────────────────────────────────────
export const getTransactionById = async (req, res, next) => {
  try {
    const [[row]] = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name, a.icon AS account_icon, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts   a ON t.account_id  = a.id
       WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, req.user.id],
    );
    if (!row) return error(res, 'Không tìm thấy giao dịch.', 404);
    return success(res, row);
  } catch (err) { next(err); }
};

// ── PUT /transactions/:id ────────────────────────────────────
export const updateTransaction = async (req, res, next) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;
    const txId   = req.params.id;

    // Lấy giao dịch cũ
    const [[oldTx]] = await conn.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [txId, userId],
    );
    if (!oldTx) {
      await conn.rollback(); conn.release();
      return error(res, 'Không tìm thấy giao dịch.', 404);
    }

    // Đảo ngược balance cũ
    const [[oldAcc]] = await conn.execute('SELECT balance FROM accounts WHERE id = ?', [oldTx.account_id]);
    const reversedBalance = oldTx.type === 'income'
      ? parseFloat(oldAcc.balance) - parseFloat(oldTx.amount)
      : parseFloat(oldAcc.balance) + parseFloat(oldTx.amount);
    await conn.execute('UPDATE accounts SET balance = ? WHERE id = ?', [reversedBalance, oldTx.account_id]);

    // Xác định dữ liệu mới
    const newAccountId    = req.body.account_id    || oldTx.account_id;
    const newCategoryId   = req.body.category_id   || oldTx.category_id;
    const newType         = req.body.type           || oldTx.type;
    const newAmount       = parseFloat(req.body.amount ?? oldTx.amount);
    const newDescription  = req.body.description   ?? oldTx.description;
    const newNote         = req.body.note           ?? oldTx.note;
    const newDate         = req.body.transaction_date ?? oldTx.transaction_date;

    // Áp balance mới (hỗ trợ đổi account)
    const [[newAcc]] = await conn.execute('SELECT balance FROM accounts WHERE id = ? AND user_id = ?', [newAccountId, userId]);
    if (!newAcc) {
      await conn.rollback(); conn.release();
      return error(res, 'Tài khoản mới không tồn tại.', 404);
    }
    const updatedBalance = newType === 'income'
      ? parseFloat(newAcc.balance) + newAmount
      : parseFloat(newAcc.balance) - newAmount;
    await conn.execute('UPDATE accounts SET balance = ? WHERE id = ?', [updatedBalance, newAccountId]);

    // Cập nhật giao dịch
    await conn.execute(
      `UPDATE transactions
       SET account_id = ?, category_id = ?, type = ?, amount = ?, description = ?, note = ?, transaction_date = ?
       WHERE id = ?`,
      [newAccountId, newCategoryId, newType, newAmount, newDescription, newNote, newDate, txId],
    );

    await conn.commit();
    conn.release();

    const [[updated]] = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name, a.icon AS account_icon, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts   a ON t.account_id  = a.id
       WHERE t.id = ?`,
      [txId],
    );

    return success(res, updated, 'Cập nhật giao dịch thành công!');
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ── DELETE /transactions/:id ─────────────────────────────────
export const deleteTransaction = async (req, res, next) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [[tx]] = await conn.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!tx) {
      await conn.rollback(); conn.release();
      return error(res, 'Không tìm thấy giao dịch.', 404);
    }

    // Hoàn trả balance
    const [[acc]] = await conn.execute('SELECT balance FROM accounts WHERE id = ?', [tx.account_id]);
    const restoredBalance = tx.type === 'income'
      ? parseFloat(acc.balance) - parseFloat(tx.amount)
      : parseFloat(acc.balance) + parseFloat(tx.amount);
    await conn.execute('UPDATE accounts SET balance = ? WHERE id = ?', [restoredBalance, tx.account_id]);

    await conn.execute('DELETE FROM transactions WHERE id = ?', [req.params.id]);

    await conn.commit();
    conn.release();

    return success(res, null, 'Xóa giao dịch thành công!');
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};
