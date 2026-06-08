// src/routes/report.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { getSummary, getMonthlyChart, getCategoryBreakdown, getTopCategories, getDailyChart } from '../controllers/report.controller.js';

const router = Router();
router.use(auth);

router.get('/summary',            getSummary);
router.get('/monthly-chart',      getMonthlyChart);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/top-categories',     getTopCategories);
router.get('/daily-chart',        getDailyChart);

export default router;
