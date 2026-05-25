// backend/src/controllers/ml.controller.js
// Controller xử lý các tính năng học máy

import { success, error } from '../utils/response.js';
import { classifyTransaction, suggestBudget, retrainModels, checkMLHealth } from '../services/ml.service.js';

/**
 * POST /api/v1/ml/classify
 * Body: { "description": "Grab food cơm trưa" }
 * Trả về: danh mục gợi ý + độ tin cậy
 */
export const classify = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description?.trim()) {
      return error(res, 'Vui lòng cung cấp mô tả giao dịch', 400);
    }

    const result = await classifyTransaction(description.trim());

    if (!result) {
      return error(res, 'ML Service không khả dụng. Vui lòng thử lại.', 503);
    }

    return success(res, result, 'Phân loại thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ml/suggest-budget
 * Trả về gợi ý ngân sách cho user đang đăng nhập
 */
export const getBudgetSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await suggestBudget(userId);

    if (!result) {
      return error(res, 'ML Service không khả dụng. Vui lòng thử lại.', 503);
    }

    return success(res, result, 'Gợi ý ngân sách thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ml/retrain
 * Train lại model (chỉ admin hoặc khi cần)
 */
export const retrain = async (req, res, next) => {
  try {
    const result = await retrainModels();
    if (!result) {
      return error(res, 'ML Service không khả dụng', 503);
    }
    return success(res, result, 'Train lại model thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ml/health
 * Kiểm tra trạng thái ML Service
 */
export const mlHealth = async (req, res, next) => {
  try {
    const result = await checkMLHealth();
    return success(res, result);
  } catch (err) {
    next(err);
  }
};
