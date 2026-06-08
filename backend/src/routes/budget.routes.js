// src/routes/budget.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budget.controller.js';

const router = Router();
router.use(auth);

router.get('/', getBudgets);
router.delete('/:id', deleteBudget);

router.post('/', [
  body('category_id').isInt({ min: 1 }).withMessage('category_id không hợp lệ'),
  body('amount_limit').isFloat({ gt: 0 }).withMessage('Hạn mức phải lớn hơn 0'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Tháng phải từ 1-12'),
  body('year').optional().isInt({ min: 2000 }).withMessage('Năm không hợp lệ'),
], validate, createBudget);

router.put('/:id', [
  body('amount_limit').isFloat({ gt: 0 }).withMessage('Hạn mức phải lớn hơn 0'),
], validate, updateBudget);

export default router;
