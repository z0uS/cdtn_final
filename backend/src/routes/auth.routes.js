// src/routes/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate.middleware.js';
import { register, login, refreshToken, logout, forgotPassword } from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit cho login: 10 lần / 15 phút
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/register
router.post('/register', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ max: 100 }).withMessage('Họ tên tối đa 100 ký tự'),
], validate, register);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
], validate, login);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token không được để trống'),
], validate, refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải từ 6 ký tự trở lên'),
], validate, forgotPassword);

export default router;
