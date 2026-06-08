// src/routes/healthScore.routes.js
// Routes điểm sức khoẻ tài chính

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import {
  getScore, recalculate, getHistory, analyzeScore,
} from '../controllers/healthScore.controller.js';

const router = Router();
router.use(auth);

router.get('/',             getScore);
router.post('/recalculate', recalculate);
router.get('/history',      getHistory);
router.post('/analyze', analyzeScore);

export default router;
