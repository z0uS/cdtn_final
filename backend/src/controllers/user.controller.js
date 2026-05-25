// src/controllers/user.controller.js
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── GET /users/profile ───────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT id, email, full_name, avatar_url, currency, theme, created_at FROM users WHERE id = ?',
      [req.user.id],
    );
    if (!rows.length) return error(res, 'Không tìm thấy người dùng.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

// ── PUT /users/profile ───────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { full_name, email, currency, theme, avatar_url } = req.body;
    const fields = [];
    const values = [];

    if (full_name !== undefined) { fields.push('full_name = ?');  values.push(full_name.trim()); }
    if (email     !== undefined) { fields.push('email = ?');      values.push(email.trim()); }
    if (currency  !== undefined) { fields.push('currency = ?');   values.push(currency); }
    if (theme     !== undefined) { fields.push('theme = ?');      values.push(theme); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }

    if (!fields.length) return error(res, 'Không có dữ liệu cần cập nhật.', 400);

    values.push(req.user.id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await query(
      'SELECT id, email, full_name, avatar_url, currency, theme FROM users WHERE id = ?',
      [req.user.id],
    );
    return success(res, rows[0], 'Cập nhật thông tin thành công!');
  } catch (err) { next(err); }
};

// ── PUT /users/change-password ───────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;

    // Lấy password_hash hiện tại
    const [rows] = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return error(res, 'Người dùng không tồn tại.', 404);

    const isMatch = await bcrypt.compare(old_password, rows[0].password_hash);
    if (!isMatch) return error(res, 'Mật khẩu cũ không đúng.', 400);

    const newHash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return success(res, null, 'Đổi mật khẩu thành công!');
  } catch (err) { next(err); }
};

// ── POST /users/upload-avatar ────────────────────────────────
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Vui lòng chọn file ảnh.', 400);

    const avatarUrl = `/uploads/${req.file.filename}`;
    await query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);

    return success(res, { avatar_url: avatarUrl }, 'Cập nhật ảnh đại diện thành công!');
  } catch (err) { next(err); }
};
