// src/services/aiContext.service.js
// Xây dựng context tài chính thực để inject vào AI prompt

import { query } from '../config/db.js';

export async function buildUserFinancialContext(userId) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // 1. Tổng thu chi 3 tháng gần nhất
  const [monthly] = await query(
    `SELECT MONTH(transaction_date) as m, YEAR(transaction_date) as y,
            SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
     FROM transactions WHERE user_id=?
       AND transaction_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
     GROUP BY m, y ORDER BY y DESC, m DESC LIMIT 3`,
    [userId],
  );

  // 2. Top 5 danh mục chi tiêu tháng này
  const [topCats] = await query(
    `SELECT c.name, SUM(t.amount) as total,
            ROUND(SUM(t.amount) /
              NULLIF((SELECT SUM(amount) FROM transactions
                      WHERE user_id=? AND type='expense'
                      AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?), 0) * 100, 1
            ) as pct
     FROM transactions t JOIN categories c ON t.category_id=c.id
     WHERE t.user_id=? AND t.type='expense'
       AND MONTH(t.transaction_date)=? AND YEAR(t.transaction_date)=?
     GROUP BY c.id, c.name ORDER BY total DESC LIMIT 5`,
    [userId, month, year, userId, month, year],
  );

  // 3. Trạng thái ngân sách tháng này
  const [budgets] = await query(
    `SELECT c.name, b.amount_limit,
            COALESCE(SUM(t.amount), 0) as spent,
            ROUND(COALESCE(SUM(t.amount), 0) / b.amount_limit * 100, 0) as pct
     FROM budgets b JOIN categories c ON b.category_id=c.id
     LEFT JOIN transactions t ON t.category_id=b.category_id
       AND t.user_id=b.user_id
       AND MONTH(t.transaction_date)=? AND YEAR(t.transaction_date)=?
     WHERE b.user_id=? AND b.month=? AND b.year=?
     GROUP BY c.name, b.amount_limit`,
    [month, year, userId, month, year],
  );

  // 4. Mục tiêu tiết kiệm (nếu có bảng saving_goals)
  let goals = [];
  try {
    const [g] = await query(
      `SELECT name, target_amount, current_amount,
              ROUND(current_amount / target_amount * 100, 0) as pct
       FROM saving_goals WHERE user_id=? AND status='active' LIMIT 3`,
      [userId],
    );
    goals = g;
  } catch { /* bảng chưa tồn tại thì bỏ qua */ }

  return { monthly, topCats, budgets, goals, month, year };
}

export function buildEnhancedSystemPrompt(context) {
  const { monthly, topCats, budgets, goals, month, year } = context;
  const thisMonth = monthly[0] || { income: 0, expense: 0 };
  const income    = Number(thisMonth.income);
  const expense   = Number(thisMonth.expense);
  const savings   = income - expense;
  const rate      = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  const overBudget  = budgets.filter((b) => Number(b.pct) >= 100);
  const warnBudget  = budgets.filter((b) => Number(b.pct) >= 80 && Number(b.pct) < 100);

  const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

  return `Bạn là trợ lý tài chính cá nhân thông minh. Dưới đây là dữ liệu TÀI CHÍNH THỰC của người dùng:

THÁNG HIỆN TẠI (tháng ${month}/${year}):
- Thu nhập: ${fmt(income)}
- Chi tiêu: ${fmt(expense)}
- Tiết kiệm: ${fmt(savings)} (tỷ lệ ${rate}%)

TOP 5 DANH MỤC CHI NHIỀU NHẤT:
${topCats.length ? topCats.map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.total)} (${c.pct}%)`).join('\n') : 'Chưa có dữ liệu'}

TÌNH TRẠNG NGÂN SÁCH:
${overBudget.length ? '⛔ Đã vượt ngân sách: ' + overBudget.map((b) => `${b.name} (${b.pct}%)`).join(', ') : ''}
${warnBudget.length ? '⚠️ Sắp vượt ngân sách: ' + warnBudget.map((b) => `${b.name} (${b.pct}%)`).join(', ') : ''}
${!overBudget.length && !warnBudget.length ? '✅ Ngân sách đang trong kiểm soát tốt' : ''}

${goals.length ? `MỤC TIÊU TIẾT KIỆM:\n${goals.map((g) => `- ${g.name}: ${g.pct}% (còn thiếu ${fmt(Number(g.target_amount) - Number(g.current_amount))})`).join('\n')}` : ''}

QUY TẮC TRẢ LỜI BẮT BUỘC:
- Luôn dùng số liệu cụ thể từ dữ liệu trên, tuyệt đối không nói chung chung
- Đơn vị tiền: định dạng X.XXX.XXXđ
- Ngôn ngữ: tiếng Việt, thân thiện, ngắn gọn (không quá 200 từ)
- Cuối mỗi câu trả lời: đề xuất đúng 1 hành động cụ thể user nên làm ngay hôm nay
- Nếu user hỏi ngoài phạm vi tài chính cá nhân: lịch sự từ chối và hướng về chủ đề tài chính`;
}

export async function generateSuggestions(context) {
  const { budgets, topCats, monthly, goals } = context;
  const suggestions = [];

  const overBudget = budgets.filter((b) => Number(b.pct) >= 80);
  if (overBudget.length > 0) {
    suggestions.push(`Tôi nên cắt giảm chi tiêu ${overBudget[0].name} như thế nào?`);
  }

  if (topCats.length > 0) {
    suggestions.push(`Tháng này tôi chi nhiều nhất cho ${topCats[0].name}, có hợp lý không?`);
  }

  const thisMonth = monthly[0] || { income: 0, expense: 0 };
  const income    = Number(thisMonth.income);
  const expense   = Number(thisMonth.expense);
  if (income > 0 && (expense / income) > 0.8) {
    suggestions.push('Chi tiêu tháng này đang cao, tôi cần điều chỉnh gì?');
  } else {
    suggestions.push('Tháng này tôi tiêu hợp lý chưa?');
  }

  if (goals.length > 0) {
    suggestions.push(`Kế hoạch đạt mục tiêu "${goals[0].name}" của tôi có đúng hướng không?`);
  } else {
    suggestions.push('Tôi nên đặt mục tiêu tiết kiệm như thế nào?');
  }

  suggestions.push('Tháng tới tôi cần chú ý điều gì?');

  return suggestions.slice(0, 5);
}
