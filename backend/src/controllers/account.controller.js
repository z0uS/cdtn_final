// src/controllers/account.controller.js
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── GET /accounts ────────────────────────────────────────────
export const getAccounts = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM transactions t WHERE t.account_id = a.id) AS transaction_count
       FROM accounts a
       WHERE a.user_id = ?
       ORDER BY a.is_default DESC, a.created_at ASC`,
      [req.user.id],
    );

    // Tính tổng số dư
    const totalBalance = rows.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    return success(res, { accounts: rows, total_balance: totalBalance });
  } catch (err) { next(err); }
};

// ── POST /accounts ───────────────────────────────────────────
export const createAccount = async (req, res, next) => {
  try {
    const { name, type, balance = 0, color = '#6366f1', icon = 'Wallet' } = req.body;

    const [result] = await query(
      'INSERT INTO accounts (user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name.trim(), type, parseFloat(balance), color, icon],
    );

    const [rows] = await query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Tạo tài khoản thành công!', 201);
  } catch (err) { next(err); }
};

// ── GET /accounts/:id ────────────────────────────────────────
export const getAccountById = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!rows.length) return error(res, 'Không tìm thấy tài khoản.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

// ── PUT /accounts/:id ────────────────────────────────────────
export const updateAccount = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    const [existing] = await query(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing.length) return error(res, 'Không tìm thấy tài khoản.', 404);

    const fields = [];
    const values = [];
    if (name  !== undefined) { fields.push('name = ?');  values.push(name.trim()); }
    if (type  !== undefined) { fields.push('type = ?');  values.push(type); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }
    if (icon  !== undefined) { fields.push('icon = ?');  values.push(icon); }

    if (!fields.length) return error(res, 'Không có dữ liệu cần cập nhật.', 400);

    values.push(req.params.id);
    await query(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Cập nhật tài khoản thành công!');
  } catch (err) { next(err); }
};

// ── DELETE /accounts/:id ─────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing.length) return error(res, 'Không tìm thấy tài khoản.', 404);

    // Không cho xóa tài khoản mặc định
    if (existing[0].is_default) {
      return error(res, 'Không thể xóa tài khoản mặc định.', 400);
    }

    // Kiểm tra có giao dịch không
    const [txCheck] = await query(
      'SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = ?',
      [req.params.id],
    );
    if (txCheck[0].cnt > 0) {
      return error(res, 'Không thể xóa tài khoản đang có giao dịch.', 400);
    }

    // Kiểm tra có lịch sử chuyển tiền không
    const [transferCheck] = await query(
      'SELECT COUNT(*) AS cnt FROM transfers WHERE from_account_id = ? OR to_account_id = ?',
      [req.params.id, req.params.id],
    );
    if (transferCheck[0].cnt > 0) {
      return error(res, 'Không thể xóa tài khoản đang có lịch sử chuyển tiền.', 400);
    }

    await query('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    return success(res, null, 'Xóa tài khoản thành công!');
  } catch (err) { next(err); }
};

// ── PUT /accounts/:id/set-default ───────────────────────────
export const setDefaultAccount = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing.length) return error(res, 'Không tìm thấy tài khoản.', 404);

    // Bỏ default tất cả tài khoản của user
    await query('UPDATE accounts SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    // Đặt default cho tài khoản này
    await query('UPDATE accounts SET is_default = 1 WHERE id = ?', [req.params.id]);

    return success(res, null, 'Đã đặt làm tài khoản mặc định!');
  } catch (err) { next(err); }
};
