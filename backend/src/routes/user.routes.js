// src/routes/user.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { uploadSingle } from '../middlewares/upload.middleware.js';
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../controllers/user.controller.js';

const router = Router();
router.use(auth);

router.get('/profile', getProfile);

router.put('/profile', [
  body('full_name').optional().trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('currency').optional().isIn(['VND', 'USD', 'EUR']).withMessage('Đơn vị tiền tệ không hợp lệ'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Theme không hợp lệ'),
], validate, updateProfile);

router.put('/change-password', [
  body('old_password').notEmpty().withMessage('Mật khẩu cũ không được để trống'),
  body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
], validate, changePassword);

router.post('/upload-avatar', uploadSingle('avatar'), uploadAvatar);

export default router;
