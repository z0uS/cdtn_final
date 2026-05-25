// src/api/mlApi.js
// Gọi thẳng Flask ML Service (port 5001) — không qua Node.js backend
// Flask đã có CORS enabled nên frontend gọi trực tiếp được

import axios from 'axios';

const ML_DIRECT_URL = import.meta.env.VITE_ML_URL || 'http://localhost:5001';

const mlAxios = axios.create({
  baseURL: ML_DIRECT_URL,
  timeout: 5000,
});

/**
 * Phân loại danh mục giao dịch tự động
 * @param {string} description - Mô tả giao dịch
 * @returns {{ category, confidence, all_probs }} hoặc null nếu lỗi
 */
export const classifyTransactionApi = async (description) => {
  try {
    const { data } = await mlAxios.post('/classify', { description });
    return data || null;
  } catch {
    // ML Service offline → bỏ qua, không làm phiền người dùng
    return null;
  }
};

/**
 * Lấy gợi ý hạn mức ngân sách thông minh
 * Cần truyền user_id vì gọi trực tiếp Flask (không có auth middleware)
 * @returns {{ suggestions: Array }} hoặc null nếu lỗi
 */
export const getBudgetSuggestionsApi = async (userId = 1) => {
  try {
    const { data } = await mlAxios.get('/suggest-budget', { params: { user_id: userId } });
    return data || null;
  } catch {
    return null;
  }
};

/**
 * Kiểm tra ML Service có online không
 */
export const checkMLHealthApi = async () => {
  try {
    const { data } = await mlAxios.get('/health');
    return data || null;
  } catch {
    return { status: 'offline' };
  }
};

