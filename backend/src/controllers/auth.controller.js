// src/controllers/auth.controller.js
// Xử lý đăng ký, đăng nhập, refresh token

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── Helper tạo token ─────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, full_name: user.full_name };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
};

// ── POST /auth/register ──────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return error(res, 'Email này đã được đăng ký. Vui lòng dùng email khác.', 409);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo user
    const [result] = await query(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), password_hash, full_name.trim()],
    );
    const userId = result.insertId;

    // Tạo tài khoản "Tiền mặt" mặc định
    await query(
      'INSERT INTO accounts (user_id, name, type, balance, color, icon, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, 'Tiền mặt', 'cash', 0, '#f59e0b', 'Wallet', 1],
    );

    // Lấy thông tin user vừa tạo
    const [users] = await query(
      'SELECT id, email, full_name, avatar_url, currency, theme, created_at FROM users WHERE id = ?',
      [userId],
    );
    const user = users[0];

    const { accessToken, refreshToken } = generateTokens(user);

    return success(
      res,
      { user, accessToken, refreshToken },
      'Đăng ký thành công! Chào mừng bạn.',
      201,
    );
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/login ─────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const [users] = await query(
      'SELECT id, email, password_hash, full_name, avatar_url, currency, theme FROM users WHERE email = ?',
      [email.toLowerCase().trim()],
    );

    if (users.length === 0) {
      return error(res, 'Email hoặc mật khẩu không đúng.', 401);
    }

    const user = users[0];

    // So khớp password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Email hoặc mật khẩu không đúng.', 401);
    }

    // Không trả về password_hash
    const { password_hash, ...userInfo } = user;

    const { accessToken, refreshToken } = generateTokens(userInfo);

    return success(res, { user: userInfo, accessToken, refreshToken }, 'Đăng nhập thành công!');
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/refresh-token ─────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return error(res, 'Refresh token không được để trống.', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return error(res, 'Refresh token không hợp lệ hoặc đã hết hạn.', 401);
    }

    // Lấy thông tin user mới nhất
    const [users] = await query(
      'SELECT id, email, full_name, avatar_url, currency, theme FROM users WHERE id = ?',
      [decoded.id],
    );
    if (users.length === 0) {
      return error(res, 'Người dùng không tồn tại.', 401);
    }

    const user = users[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return success(res, { accessToken, refreshToken: newRefreshToken }, 'Làm mới token thành công!');
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/logout ────────────────────────────────────────
export const logout = async (_req, res) => {
  // Client tự xóa token khỏi localStorage
  return success(res, null, 'Đăng xuất thành công!');
};

// ── POST /auth/forgot-password ───────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email) {
      return error(res, 'Vui lòng cung cấp email.', 400);
    }
    if (!newPassword || newPassword.length < 6) {
      return error(res, 'Vui lòng cung cấp mật khẩu mới (ít nhất 6 ký tự).', 400);
    }

    const [users] = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return error(res, 'Email không tồn tại trong hệ thống.', 404);
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, users[0].id]);

    return success(
      res,
      null,
      'Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.',
    );
  } catch (err) {
    next(err);
  }
};
