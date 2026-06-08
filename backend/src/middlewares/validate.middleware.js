// src/middlewares/validate.middleware.js
// Xử lý lỗi từ express-validator

import { validationResult } from 'express-validator';
import { error } from '../utils/response.js';

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(
      res,
      'Dữ liệu đầu vào không hợp lệ',
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg })),
    );
  }
  next();
};

export default validateMiddleware;
