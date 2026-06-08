// src/routes/recurring.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { getRecurring, createRecurring, updateRecurring, toggleRecurring, deleteRecurring } from '../controllers/recurring.controller.js';

const router = Router();
router.use(auth);

router.get('/', getRecurring);
router.put('/:id/toggle', toggleRecurring);
router.delete('/:id', deleteRecurring);

router.post('/', [
  body('account_id').isInt({ min: 1 }).withMessage('account_id không hợp lệ'),
  body('category_id').isInt({ min: 1 }).withMessage('category_id không hợp lệ'),
  body('type').isIn(['income', 'expense']).withMessage('Loại giao dịch không hợp lệ'),
  body('amount').isFloat({ gt: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('frequency').isIn(['daily','weekly','monthly','yearly']).withMessage('Tần suất không hợp lệ'),
  body('start_date').isDate().withMessage('Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
], validate, createRecurring);

router.put('/:id', [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('frequency').optional().isIn(['daily','weekly','monthly','yearly']).withMessage('Tần suất không hợp lệ'),
], validate, updateRecurring);

export default router;
