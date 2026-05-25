// backend/src/services/ml.service.js
// Kết nối Node.js Backend với Python ML Service

import axios from 'axios';

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Gọi ML Service để dự đoán danh mục từ mô tả giao dịch
 * @param {string} description - Tên/ghi chú giao dịch
 * @returns {{ category: string, confidence: number, all_probs: object }}
 */
export async function classifyTransaction(description) {
  try {
    const { data } = await axios.post(`${ML_BASE_URL}/classify`, { description }, { timeout: 5000 });
    return data;
  } catch (err) {
    console.error('[ML] classify error:', err.message);
    return null; // Không làm crash app nếu ML service tắt
  }
}

/**
 * Gợi ý ngân sách thông minh cho một user
 * @param {number} userId
 * @returns {{ suggestions: Array }}
 */
export async function suggestBudget(userId) {
  try {
    const { data } = await axios.get(`${ML_BASE_URL}/suggest-budget`, {
      params:  { user_id: userId },
      timeout: 5000,
    });
    return data;
  } catch (err) {
    console.error('[ML] suggest-budget error:', err.message);
    return null;
  }
}

/**
 * Trigger train lại model (gọi sau khi có nhiều giao dịch mới)
 */
export async function retrainModels() {
  try {
    const { data } = await axios.post(`${ML_BASE_URL}/train`, {}, { timeout: 30000 });
    return data;
  } catch (err) {
    console.error('[ML] retrain error:', err.message);
    return null;
  }
}

/**
 * Kiểm tra ML Service có đang chạy không
 */
export async function checkMLHealth() {
  try {
    const { data } = await axios.get(`${ML_BASE_URL}/health`, { timeout: 3000 });
    return data;
  } catch {
    return { status: 'offline' };
  }
}
