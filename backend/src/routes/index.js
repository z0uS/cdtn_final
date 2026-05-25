// src/routes/index.js
// Registry: gộp tất cả routes vào /api/v1

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import accountRoutes from './account.routes.js';
import categoryRoutes from './category.routes.js';
import transactionRoutes from './transaction.routes.js';
import budgetRoutes from './budget.routes.js';
import transferRoutes from './transfer.routes.js';
import reportRoutes from './report.routes.js';
import recurringRoutes from './recurring.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';
import receiptRoutes from './receipt.routes.js';
import healthScoreRoutes from './healthScore.routes.js';
import spendingMethodRoutes from './spendingMethod.routes.js';
import mlRoutes from './ml.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running 🚀', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/transfers', transferRoutes);
router.use('/reports', reportRoutes);
router.use('/recurring', recurringRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/receipts', receiptRoutes);
router.use('/health-score', healthScoreRoutes);
router.use('/spending-methods', spendingMethodRoutes);
router.use('/ml', mlRoutes);

export default router;
