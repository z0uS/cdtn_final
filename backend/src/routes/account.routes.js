// src/routes/account.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  getAccounts, createAccount, getAccountById,
  updateAccount, deleteAccount, setDefaultAccount,
} from '../controllers/account.controller.js';

const router = Router();
router.use(auth);

router.get('/',     getAccounts);
router.get('/:id',  getAccountById);
router.delete('/:id', deleteAccount);
router.put('/:id/set-default', setDefaultAccount);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Tên tài khoản không được để trống'),
  body('type').isIn(['cash','bank','e_wallet','credit_card']).withMessage('Loại tài khoản không hợp lệ'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Số dư phải >= 0'),
], validate, createAccount);

router.put('/:id', [
  body('type').optional().isIn(['cash','bank','e_wallet','credit_card']).withMessage('Loại không hợp lệ'),
], validate, updateAccount);

export default router;
