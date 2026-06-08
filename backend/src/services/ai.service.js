// src/services/ai.service.js
// Gọi Google Gemini API + tạo system prompt với dữ liệu tài chính

import genAI, { getModel } from '../config/ai.js';
import { query } from '../config/db.js';
import { getCurrentMonthYear } from '../utils/dateHelper.js';

/**
 * Xây dựng system prompt từ dữ liệu tài chính thực của user
 */
export const buildSystemPrompt = async (userId) => {
  const { month, year } = getCurrentMonthYear();

  // Lấy summary tháng này
  const [[summary]] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
    [userId, month, year],
  );

  // Top 5 danh mục chi tiêu nhiều nhất
  const [topCats] = await query(
    `SELECT c.name, COALESCE(SUM(t.amount), 0) AS total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = ? AND t.type = 'expense'
       AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
     GROUP BY c.id, c.name
     ORDER BY total DESC
     LIMIT 5`,
    [userId, month, year],
  );

  // Trạng thái ngân sách
  const [budgets] = await query(
    `SELECT c.name AS cat_name, b.amount_limit,
       COALESCE((
         SELECT SUM(t.amount) FROM transactions t
         WHERE t.user_id = b.user_id AND t.category_id = b.category_id
           AND t.type = 'expense'
           AND MONTH(t.transaction_date) = b.month AND YEAR(t.transaction_date) = b.year
       ), 0) AS spent
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
    [userId, month, year],
  );

  const income  = parseFloat(summary.income);
  const expense = parseFloat(summary.expense);
  const savings = income - expense;
  const rate    = income > 0 ? Math.round((savings / income) * 100) : 0;

  const topCatsStr = topCats.length
    ? topCats.map((c) => `${c.name}: ${parseFloat(c.total).toLocaleString('vi-VN')}₫`).join(', ')
    : 'Chưa có dữ liệu';

  const budgetStr = budgets.length
    ? budgets.map((b) => {
        const pct = b.amount_limit > 0 ? Math.round((parseFloat(b.spent) / parseFloat(b.amount_limit)) * 100) : 0;
        return `${b.cat_name}: ${pct}% (${parseFloat(b.spent).toLocaleString('vi-VN')}/${parseFloat(b.amount_limit).toLocaleString('vi-VN')}₫)`;
      }).join(', ')
    : 'Chưa thiết lập ngân sách';

  return `Bạn là trợ lý tài chính AI thông minh, thân thiện, nói tiếng Việt.
Dữ liệu tài chính tháng ${month}/${year} của người dùng:
- Tổng thu: ${income.toLocaleString('vi-VN')}₫
- Tổng chi: ${expense.toLocaleString('vi-VN')}₫
- Tiết kiệm: ${savings.toLocaleString('vi-VN')}₫ (${rate}% thu nhập)
- Top chi tiêu: ${topCatsStr}
- Ngân sách: ${budgetStr}

Hướng dẫn trả lời:
- Trả lời bằng tiếng Việt, ngắn gọn, thực tế, có ích
- Dùng số liệu thực tế của user khi phân tích
- Đưa ra lời khuyên cụ thể, tránh chung chung
- Sử dụng emoji phù hợp để làm sinh động câu trả lời`;
};

/**
 * Mock response khi không có API key
 */
const getMockResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('chi tiêu') || msg.includes('tháng')) {
    return '📊 Dựa trên dữ liệu của bạn, tháng này chi tiêu đang ở mức bình thường. Hãy theo dõi danh mục "Ăn uống" và "Mua sắm" vì đây thường là 2 danh mục dễ vượt ngân sách nhất. Gợi ý: đặt hạn mức ngân sách cho từng danh mục trong mục Ngân sách.';
  }
  return '👋 Xin chào! Tôi là trợ lý tài chính AI. Hãy hỏi tôi về tình hình chi tiêu, cách tiết kiệm, hoặc phân tích ngân sách của bạn nhé! _(Lưu ý: đang dùng chế độ demo – thêm GEMINI_API_KEY để dùng AI thật)_';
};

/**
 * Gọi Gemini API với system prompt + lịch sử + câu hỏi mới
 * @param {string} systemPrompt
 * @param {Array}  history - [{role:'user'|'assistant', content: string}]
 * @param {string} userMessage
 */
export const callAI = async (systemPrompt, history = [], userMessage) => {
  if (!genAI) {
    // Fallback mock nếu ko import được genAI hoặc ko có key
    return getMockResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.AI_MODEL || 'gemini-flash-latest',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.map((h) => ({
        role:  h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (err) {
    console.error('AI API error:', err.message);
    throw new Error('AI Error: ' + err.message);
  }
};
