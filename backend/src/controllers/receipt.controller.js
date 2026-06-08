// src/controllers/receipt.controller.js
// Controller quét và xử lý ảnh hoá đơn

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeReceipt } from '../services/receipt.service.js';
import { success, error } from '../utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/v1/receipts/scan
export const scanReceipt = async (req, res, next) => {
  if (!req.file) {
    return error(res, 'Vui lòng chọn ảnh hoá đơn', 400);
  }

  const filePath = req.file.path;

  try {
    const result = await analyzeReceipt(filePath);

    if (!result.success) {
      // Xoá file nếu không phải hoá đơn
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(422).json({ success: false, message: result.message });
    }

    // Trả về URL để frontend hiển thị ảnh preview
    result.data.image_url = `/uploads/${req.file.filename}`;
    result.data.filename  = req.file.filename;

    return success(res, result.data, 'Đọc hoá đơn thành công');
  } catch (err) {
    // Xoá file khi gặp lỗi
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (err.message?.includes('SAFETY') || err.message?.includes('RECITATION')) {
      return error(res, 'Ảnh không hợp lệ hoặc bị từ chối bởi AI.', 400);
    }
    next(err);
  }
};

// DELETE /api/v1/receipts/file
export const deleteReceiptFile = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return error(res, 'Tên file không hợp lệ', 400);
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    const filePath  = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return success(res, null, 'Đã xoá ảnh');
  } catch (err) {
    next(err);
  }
};
