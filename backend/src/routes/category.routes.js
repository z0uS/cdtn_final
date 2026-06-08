// src/routes/category.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';

const router = Router();
router.use(auth);

router.get('/', getCategories);
router.delete('/:id', deleteCategory);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Tên danh mục không được để trống'),
  body('type').isIn(['income', 'expense']).withMessage('Loại danh mục phải là income hoặc expense'),
], validate, createCategory);

router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Tên danh mục không được để trống'),
], validate, updateCategory);

export default router;
