// src/controllers/healthScore.controller.js
// Controller điểm sức khoẻ tài chính

import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { calculateHealthScore } from '../services/healthScore.service.js';
import { getModel } from '../config/ai.js';

// GET /api/v1/health-score?month=&year=
export const getScore = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    // Lấy điểm từ DB (nếu đã tính)
    const [[row]] = await query(
      `SELECT * FROM financial_health_scores
       WHERE user_id=? AND month=? AND year=?`,
      [req.user.id, month, year],
    );

    // Lấy điểm tháng trước để so sánh
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const [[prevRow]] = await query(
      `SELECT total_score FROM financial_health_scores
       WHERE user_id=? AND month=? AND year=?`,
      [req.user.id, prevMonth, prevYear],
    );

    if (row) {
      return success(res, {
        total_score: row.total_score,
        grade: row.grade,
        month: row.month,
        year: row.year,
        breakdown: {
          savings:   { score: row.score_savings, max: 30, label: 'Tỷ lệ tiết kiệm' },
          budget:    { score: row.score_budget, max: 25, label: 'Tuân thủ ngân sách' },
          stability: { score: row.score_stability, max: 20, label: 'Ổn định chi tiêu' },
          diversity: { score: row.score_diversity, max: 15, label: 'Đa dạng nguồn thu' },
          trend:     { score: row.score_trend, max: 10, label: 'Xu hướng cải thiện' },
        },
        meta: {
          savings_rate_pct: row.savings_rate,
          cv_value: row.cv_value,
          sources: row.income_sources,
        },
        prev_score: prevRow?.total_score || null
      });
    }

    // Chưa có → tính mới
    const result = await calculateHealthScore(req.user.id, month, year);
    return success(res, { ...result, prev_score: prevRow?.total_score || null });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/health-score/recalculate
export const recalculate = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const result = await calculateHealthScore(req.user.id, month, year);
    return success(res, result, 'Đã tính lại điểm sức khoẻ tài chính');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/health-score/history
export const getHistory = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT month, year, total_score, grade
       FROM financial_health_scores
       WHERE user_id=? ORDER BY year DESC, month DESC LIMIT 6`,
      [req.user.id],
    );
    return success(res, rows.reverse());
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/health-score/analyze
export const analyzeScore = async (req, res, next) => {
  try {
    const { breakdown, total_score } = req.body;
    if (!breakdown) return error(res, 'Thiếu dữ liệu breakdown', 400);

    const model = getModel();
    if (!model) {
      // Mock data
      return success(res, {
        overview: `Bạn đạt ${total_score}/100 điểm. Tình hình tài chính của bạn đang ở mức khá nhưng cần cải thiện thêm về tiết kiệm.`,
        strengths: ['Đã thiết lập ngân sách cơ bản', 'Thu nhập ổn định'],
        weaknesses: ['Tỷ lệ tiết kiệm còn thấp', 'Phụ thuộc vào 1 nguồn thu'],
        recommendations: ['Trích 20% thu nhập ngay khi nhận lương', 'Tìm kiếm thêm nguồn thu nhập phụ']
      });
    }

    // Lọc lấy các tiêu chí để prompt dễ hiểu hơn
    const criteriaDetails = Object.values(breakdown).map(v => `${v.label}: ${v.score}/${v.max}`).join(', ');

    const chat   = model.startChat({ history: [] });
    const prompt = `Người dùng đạt ${total_score}/100 điểm sức khoẻ tài chính.
Chi tiết các tiêu chí: ${criteriaDetails}.

Hãy phân tích ngắn gọn và trực quan:
1. Tại sao họ được số điểm này?
2. Đâu là điểm mạnh và điểm yếu?
3. Cần làm gì để cải thiện?

Trả về ĐÚNG JSON format sau, KHÔNG kèm text hay markdown backtick:
{
  "overview": "Đánh giá tổng quan (2-3 câu)",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "recommendations": ["Khuyến nghị cụ thể 1", "Khuyến nghị cụ thể 2"]
}`;

    const result  = await chat.sendMessage(prompt);
    let text      = result.response.text().trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();

    const analysis = JSON.parse(text);
    return success(res, analysis);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return error(res, 'Không thể phân tích lúc này. Vui lòng thử lại.', 500);
    }
    next(err);
  }
};
