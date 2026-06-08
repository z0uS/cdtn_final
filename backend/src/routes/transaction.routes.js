// src/routes/transaction.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  getTransactions, createTransaction, getTransactionById,
  updateTransaction, deleteTransaction,
} from '../controllers/transaction.controller.js';

const router = Router();
router.use(auth);

router.get('/',     getTransactions);
router.get('/:id',  getTransactionById);
router.delete('/:id', deleteTransaction);

router.post('/', [
  body('account_id').isInt({ min: 1 }).withMessage('account_id không hợp lệ'),
  body('category_id').isInt({ min: 1 }).withMessage('category_id không hợp lệ'),
  body('type').isIn(['income', 'expense']).withMessage('Loại giao dịch phải là income hoặc expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('transaction_date').isDate().withMessage('Ngày giao dịch không hợp lệ (YYYY-MM-DD)'),
  body('description').optional().trim(),
], validate, createTransaction);

router.put('/:id', [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Loại giao dịch không hợp lệ'),
  body('transaction_date').optional().isDate().withMessage('Ngày giao dịch không hợp lệ'),
], validate, updateTransaction);

export default router;
