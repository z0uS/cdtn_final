// src/routes/receipt.routes.js
// Routes cho tính năng quét ảnh hoá đơn

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { uploadSingle } from '../middlewares/upload.middleware.js';
import { scanReceipt, deleteReceiptFile } from '../controllers/receipt.controller.js';

const router = Router();
router.use(auth);

// POST /api/v1/receipts/scan  — upload ảnh & phân tích
router.post('/scan', uploadSingle('receipt'), scanReceipt);

// DELETE /api/v1/receipts/file  — xoá file ảnh tạm
router.delete('/file', deleteReceiptFile);

export default router;
