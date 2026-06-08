// src/controllers/recurring.controller.js
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { calcNextDate } from '../services/recurring.service.js';

// ── GET /recurring ───────────────────────────────────────────
export const getRecurring = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT r.*,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         a.name AS account_name,  a.icon AS account_icon
       FROM recurring_transactions r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN accounts   a ON r.account_id  = a.id
       WHERE r.user_id = ?
       ORDER BY r.next_date ASC`,
      [req.user.id],
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// ── POST /recurring ──────────────────────────────────────────
export const createRecurring = async (req, res, next) => {
  try {
    const { account_id, category_id, type, amount, description = '', frequency, start_date } = req.body;

    const next_date = calcNextDate(start_date, frequency);

    const [result] = await query(
      `INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, next_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, account_id, category_id, type, parseFloat(amount), description, frequency, start_date, next_date],
    );

    const [[row]] = await query(
      `SELECT r.*, c.name AS category_name, a.name AS account_name
       FROM recurring_transactions r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN accounts   a ON r.account_id  = a.id
       WHERE r.id = ?`,
      [result.insertId],
    );

    return success(res, row, 'Tạo giao dịch định kỳ thành công!', 201);
  } catch (err) { next(err); }
};

// ── PUT /recurring/:id ───────────────────────────────────────
export const updateRecurring = async (req, res, next) => {
  try {
    const [[existing]] = await query(
      'SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing) return error(res, 'Không tìm thấy giao dịch định kỳ.', 404);

    const { amount, description, frequency } = req.body;
    const fields = [];
    const values = [];

    if (amount      !== undefined) { fields.push('amount = ?');      values.push(parseFloat(amount)); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (frequency   !== undefined) {
      fields.push('frequency = ?');
      values.push(frequency);
      // Tính lại next_date nếu đổi frequency
      const newNext = calcNextDate(existing.start_date, frequency);
      fields.push('next_date = ?');
      values.push(newNext);
    }

    if (!fields.length) return error(res, 'Không có dữ liệu cần cập nhật.', 400);

    values.push(req.params.id);
    await query(`UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`, values);

    const [[row]] = await query('SELECT * FROM recurring_transactions WHERE id = ?', [req.params.id]);
    return success(res, row, 'Cập nhật thành công!');
  } catch (err) { next(err); }
};

// ── PUT /recurring/:id/toggle ────────────────────────────────
export const toggleRecurring = async (req, res, next) => {
  try {
    const [[existing]] = await query(
      'SELECT id, is_active FROM recurring_transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!existing) return error(res, 'Không tìm thấy giao dịch định kỳ.', 404);

    const newStatus = existing.is_active ? 0 : 1;
    await query('UPDATE recurring_transactions SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    return success(res, { is_active: newStatus }, newStatus ? 'Đã kích hoạt!' : 'Đã tạm dừng!');
  } catch (err) { next(err); }
};

// ── DELETE /recurring/:id ────────────────────────────────────
export const deleteRecurring = async (req, res, next) => {
  try {
    const [exist] = await query(
      'SELECT id FROM recurring_transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!exist.length) return error(res, 'Không tìm thấy giao dịch định kỳ.', 404);

    await query('DELETE FROM recurring_transactions WHERE id = ?', [req.params.id]);
    return success(res, null, 'Xóa giao dịch định kỳ thành công!');
  } catch (err) { next(err); }
};
