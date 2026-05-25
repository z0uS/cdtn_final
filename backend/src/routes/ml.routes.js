// backend/src/routes/ml.routes.js
// Routes cho các tính năng học máy

import { Router } from 'express';
import authenticate from '../middlewares/auth.middleware.js';
import { classify, getBudgetSuggestions, retrain, mlHealth } from '../controllers/ml.controller.js';

const router = Router();

// Tất cả route ML đều yêu cầu đăng nhập
router.use(authenticate);

// POST /api/v1/ml/classify - Phân loại danh mục giao dịch
router.post('/classify', classify);

// GET  /api/v1/ml/suggest-budget - Gợi ý ngân sách
router.get('/suggest-budget', getBudgetSuggestions);

// POST /api/v1/ml/retrain - Train lại model
router.post('/retrain', retrain);

// GET  /api/v1/ml/health - Kiểm tra ML Service
router.get('/health', mlHealth);

export default router;
