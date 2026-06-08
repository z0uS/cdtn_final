// src/controllers/category.controller.js
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── GET /categories ──────────────────────────────────────────
// Trả về: danh mục hệ thống (user_id IS NULL) + danh mục riêng của user
export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    let sql = `
      SELECT * FROM categories
      WHERE (user_id IS NULL OR user_id = ?)
    `;
    const params = [req.user.id];

    if (type && ['income', 'expense'].includes(type)) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY is_default DESC, name ASC';

    const [rows] = await query(sql, params);
    return success(res, rows);
  } catch (err) { next(err); }
};

// ── POST /categories ─────────────────────────────────────────
export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon = 'Tag', color = '#6366f1', parent_id } = req.body;

    const [result] = await query(
      'INSERT INTO categories (user_id, parent_id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [req.user.id, parent_id || null, name.trim(), type, icon, color],
    );

    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Tạo danh mục thành công!', 201);
  } catch (err) { next(err); }
};

// ── PUT /categories/:id ──────────────────────────────────────
export const updateCategory = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [req.params.id, req.user.id],
    );
    if (!existing.length) {
      return error(res, 'Không tìm thấy danh mục hoặc không có quyền chỉnh sửa.', 404);
    }

    const { name, icon, color } = req.body;
    const fields = [];
    const values = [];
    if (name  !== undefined) { fields.push('name = ?');  values.push(name.trim()); }
    if (icon  !== undefined) { fields.push('icon = ?');  values.push(icon); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }

    if (!fields.length) return error(res, 'Không có dữ liệu cần cập nhật.', 400);

    values.push(req.params.id);
    await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Cập nhật danh mục thành công!');
  } catch (err) { next(err); }
};

// ── DELETE /categories/:id ───────────────────────────────────
export const deleteCategory = async (req, res, next) => {
  try {
    const [existing] = await query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [req.params.id, req.user.id],
    );
    if (!existing.length) {
      return error(res, 'Không tìm thấy danh mục hoặc không có quyền xóa.', 404);
    }

    // Kiểm tra có giao dịch đang dùng không
    const [txCheck] = await query(
      'SELECT COUNT(*) AS cnt FROM transactions WHERE category_id = ?',
      [req.params.id],
    );
    if (txCheck[0].cnt > 0) {
      return error(res, 'Không thể xóa danh mục đang có giao dịch.', 400);
    }

    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return success(res, null, 'Xóa danh mục thành công!');
  } catch (err) { next(err); }
};
