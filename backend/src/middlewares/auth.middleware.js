// src/middlewares/auth.middleware.js
// Xác thực JWT và gắn req.user

import jwt from 'jsonwebtoken';
import { error } from '../utils/response.js';

const authMiddleware = (req, res, next) => {
  // Lấy token từ Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Không có token xác thực. Vui lòng đăng nhập.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Gắn thông tin user vào request
    req.user = {
      id:        decoded.id,
      email:     decoded.email,
      full_name: decoded.full_name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Token không hợp lệ.', 401);
    }
    return error(res, 'Lỗi xác thực token.', 401);
  }
};

export default authMiddleware;
