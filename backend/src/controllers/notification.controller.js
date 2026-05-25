// src/controllers/notification.controller.js
import { query, queryRaw } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

// ── GET /notifications ───────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const { is_read, limit, page } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);

    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (is_read === 'false') { conditions.push('is_read = 0'); }
    if (is_read === 'true') { conditions.push('is_read = 1'); }

    const where = conditions.join(' AND ');

    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM notifications WHERE ${where}`,
      params,
    );

    const [rows] = await queryRaw(
      `SELECT * FROM notifications WHERE ${where}
       ORDER BY is_read ASC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, l, offset],
    );

    return success(res, { data: rows, pagination: buildPagination(total, p, l) });
  } catch (err) { next(err); }
};

// ── GET /notifications/unread-count ─────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const [[{ count }]] = await query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id],
    );
    return success(res, { unread_count: count });
  } catch (err) { next(err); }
};

// ── PUT /notifications/:id/read ──────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const [exist] = await query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!exist.length) return error(res, 'Không tìm thấy thông báo.', 404);

    await query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    return success(res, null, 'Đã đánh dấu đã đọc!');
  } catch (err) { next(err); }
};

// ── PUT /notifications/read-all ──────────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const [result] = await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id],
    );
    return success(res, { updated: result.affectedRows }, 'Đã đánh dấu tất cả đã đọc!');
  } catch (err) { next(err); }
};
