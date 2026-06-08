// src/routes/transfer.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { getTransfers, createTransfer } from '../controllers/transfer.controller.js';

const router = Router();
router.use(auth);

router.get('/', getTransfers);

router.post('/', [
  body('from_account_id').isInt({ min: 1 }).withMessage('from_account_id không hợp lệ'),
  body('to_account_id').isInt({ min: 1 }).withMessage('to_account_id không hợp lệ'),
  body('amount').isFloat({ gt: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('fee').optional().isFloat({ min: 0 }).withMessage('Phí phải >= 0'),
  body('transfer_date').isDate().withMessage('Ngày chuyển tiền không hợp lệ (YYYY-MM-DD)'),
], validate, createTransfer);

export default router;
