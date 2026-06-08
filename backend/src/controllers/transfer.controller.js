// src/controllers/transfer.controller.js
import { query, queryRaw, getConnection } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

// ── GET /transfers ───────────────────────────────────────────
export const getTransfers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);

    const [[{ total }]] = await query(
      'SELECT COUNT(*) AS total FROM transfers WHERE user_id = ?',
      [req.user.id],
    );

    const [rows] = await queryRaw(
      `SELECT tf.*,
         fa.name AS from_account_name, fa.icon AS from_account_icon, fa.color AS from_account_color,
         ta.name AS to_account_name,   ta.icon AS to_account_icon,   ta.color AS to_account_color
       FROM transfers tf
       LEFT JOIN accounts fa ON tf.from_account_id = fa.id
       LEFT JOIN accounts ta ON tf.to_account_id   = ta.id
       WHERE tf.user_id = ?
       ORDER BY tf.transfer_date DESC, tf.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, l, offset],
    );

    return success(res, { data: rows, pagination: buildPagination(total, p, l) });
  } catch (err) { next(err); }
};

// ── POST /transfers ──────────────────────────────────────────
export const createTransfer = async (req, res, next) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { from_account_id, to_account_id, amount, fee = 0, description, transfer_date } = req.body;
    const userId = req.user.id;

    if (parseInt(from_account_id) === parseInt(to_account_id)) {
      await conn.rollback(); conn.release();
      return error(res, 'Tài khoản nguồn và đích không được trùng nhau.', 400);
    }

    // Kiểm tra tài khoản nguồn
    const [[fromAcc]] = await conn.execute(
      'SELECT id, balance, name FROM accounts WHERE id = ? AND user_id = ?',
      [from_account_id, userId],
    );
    if (!fromAcc) {
      await conn.rollback(); conn.release();
      return error(res, 'Tài khoản nguồn không tồn tại.', 404);
    }

    const parsedAmount = parseFloat(amount);
    const parsedFee    = parseFloat(fee);
    const totalDeduct  = parsedAmount + parsedFee;

    if (parseFloat(fromAcc.balance) < totalDeduct) {
      await conn.rollback(); conn.release();
      return error(res, `Số dư tài khoản "${fromAcc.name}" không đủ.`, 400);
    }

    // Kiểm tra tài khoản đích
    const [[toAcc]] = await conn.execute(
      'SELECT id, balance FROM accounts WHERE id = ? AND user_id = ?',
      [to_account_id, userId],
    );
    if (!toAcc) {
      await conn.rollback(); conn.release();
      return error(res, 'Tài khoản đích không tồn tại.', 404);
    }

    // Thực hiện chuyển tiền
    await conn.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [totalDeduct, from_account_id],
    );
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [parsedAmount, to_account_id],
    );

    const [result] = await conn.execute(
      `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, fee, description, transfer_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, from_account_id, to_account_id, parsedAmount, parsedFee, description || null, transfer_date],
    );

    // Tạo notification
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES (?, ?, ?, 'transfer', ?)`,
      [
        userId,
        'Chuyển tiền thành công',
        `Đã chuyển ${parsedAmount.toLocaleString('vi-VN')}₫ từ "${fromAcc.name}"${parsedFee > 0 ? ` (phí: ${parsedFee.toLocaleString('vi-VN')}₫)` : ''}`,
        result.insertId,
      ],
    );

    await conn.commit();
    conn.release();

    const [[transfer]] = await query(
      `SELECT tf.*,
         fa.name AS from_account_name, ta.name AS to_account_name
       FROM transfers tf
       LEFT JOIN accounts fa ON tf.from_account_id = fa.id
       LEFT JOIN accounts ta ON tf.to_account_id   = ta.id
       WHERE tf.id = ?`,
      [result.insertId],
    );

    return success(res, transfer, 'Chuyển tiền thành công!', 201);
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};
