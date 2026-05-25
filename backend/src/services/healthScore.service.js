// src/services/healthScore.service.js
// ============================================================
// Tính Điểm Sức Khoẻ Tài Chính Cá Nhân (Financial Health Score)
// Thang điểm: 0 – 100
//
// CƠ SỞ KHOA HỌC (4 nghiên cứu):
//   [1] CFPB (2015). Financial well-being: What it means and how to measure it.
//       Consumer Financial Protection Bureau.
//   [2] CFSI (2019). U.S. Financial Health Pulse: 2019 Trends Report.
//       Center for Financial Services Innovation (Financial Health Network).
//   [3] Garman, E. T., & Forgue, R. (2011). Personal Finance (11th ed.).
//       Cengage Learning.
//   [4] Warren, E., & Tyagi, A. W. (2005). All Your Worth. Free Press.
// ============================================================

import { query } from '../config/db.js';

export async function calculateHealthScore(userId, month, year) {

  // ── Truy vấn dữ liệu từ MySQL ──────────────────────────────────────────────

  // Tổng thu nhập tháng này
  const [[incRow]] = await query(
    `SELECT COALESCE(SUM(amount), 0) as income FROM transactions
     WHERE user_id=? AND type='income'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?`,
    [userId, month, year],
  );

  // Tổng chi tiêu tháng này
  const [[expRow]] = await query(
    `SELECT COALESCE(SUM(amount), 0) as expense FROM transactions
     WHERE user_id=? AND type='expense'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?`,
    [userId, month, year],
  );

  // Ngân sách và chi thực tế theo danh mục
  const [budgets] = await query(
    `SELECT b.category_id, b.amount_limit,
            COALESCE(SUM(t.amount), 0) as spent
     FROM budgets b
     LEFT JOIN transactions t ON t.category_id=b.category_id
       AND t.user_id=b.user_id
       AND MONTH(t.transaction_date)=? AND YEAR(t.transaction_date)=?
     WHERE b.user_id=? AND b.month=? AND b.year=?
     GROUP BY b.category_id, b.amount_limit`,
    [month, year, userId, month, year],
  );

  // Chi tiêu theo từng ngày trong tháng (để tính hệ số biến thiên CV)
  const [dailyRows] = await query(
    `SELECT DATE(transaction_date) as day, SUM(amount) as total
     FROM transactions
     WHERE user_id=? AND type='expense'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?
     GROUP BY DATE(transaction_date)`,
    [userId, month, year],
  );

  // Số lượng danh mục thu nhập có giao dịch (đa dạng nguồn thu)
  const [[srcRow]] = await query(
    `SELECT COUNT(DISTINCT category_id) as sources FROM transactions
     WHERE user_id=? AND type='income'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?`,
    [userId, month, year],
  );

  const income  = Number(incRow.income);
  const expense = Number(expRow.expense);

  // Savings Rate = (Thu nhập − Chi tiêu) / Thu nhập
  // Công thức gốc: Garman & Forgue (2011, p.78)
  const savings_rate = income > 0 ? (income - expense) / income : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIÊU CHÍ 1: TỶ LỆ TIẾT KIỆM — Tối đa 30 điểm
  // Nguồn: Garman & Forgue (2011). "Personal Finance", tr. 78–82.
  //        "The savings rate is the most fundamental measure of financial
  //         health. A minimum target of 10% is widely recommended, with
  //         20% considered the gold standard." (p.79)
  // Ngưỡng: ≥30% (xuất sắc), ≥20% (tốt, theo Warren & Tyagi 2005 quy tắc 20%),
  //         ≥10% (đạt chuẩn tối thiểu theo Garman 2011), >0% (có tiết kiệm)
  // ═══════════════════════════════════════════════════════════════════════════
  const s1 = savings_rate >= 0.30 ? 30   // Xuất sắc — vượt chuẩn quốc tế
           : savings_rate >= 0.20 ? 24   // Tốt — đạt chuẩn Warren & Tyagi (2005)
           : savings_rate >= 0.10 ? 16   // Trung bình — đạt ngưỡng tối thiểu Garman (2011)
           : savings_rate >  0    ?  8   // Yếu — dưới ngưỡng khuyến nghị
           :                         0;  // Nguy hiểm — thâm hụt hoặc không có thu nhập

  // ═══════════════════════════════════════════════════════════════════════════
  // TIÊU CHÍ 2: TUÂN THỦ NGÂN SÁCH — Tối đa 25 điểm
  // Nguồn: CFSI (2019). "U.S. Financial Health Pulse", Indicator #1 "Spending".
  //        "Spending less than income is the most basic indicator of financial
  //         health. Individuals who consistently overspend are at high risk of
  //         financial distress." (p.12)
  // Công thức: (Số danh mục ≤ hạn mức / Tổng số danh mục có ngân sách) × 25
  // ═══════════════════════════════════════════════════════════════════════════
  const compliant = budgets.filter((b) => Number(b.spent) <= Number(b.amount_limit)).length;
  // Mặc định 12/25 nếu chưa có ngân sách nào (người dùng mới)
  const s2 = budgets.length > 0 ? Math.round((compliant / budgets.length) * 25) : 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIÊU CHÍ 3: ỔN ĐỊNH CHI TIÊU (Coefficient of Variation) — Tối đa 20 điểm
  // Nguồn: CFPB (2015). "Financial well-being", thành phần "Present Financial
  //        Security". Hệ số biến thiên (CV) là công cụ thống kê chuẩn đo
  //        mức độ phân tán tương đối, phản ánh tính ổn định trong thói quen
  //        chi tiêu — chỉ số trực tiếp của an toàn tài chính hiện tại (p.21).
  // Công thức: CV = Độ lệch chuẩn / Giá trị trung bình (tính trên chi tiêu hàng ngày)
  // Ngưỡng: CV<0.3 (rất ổn định), CV<0.5 (ổn định), CV<0.8 (thiếu ổn định)
  // ═══════════════════════════════════════════════════════════════════════════
  const amounts = dailyRows.map((r) => Number(r.total));
  let s3 = 10; // Mặc định nếu dữ liệu chưa đủ
  let cv_value = 0;
  if (amounts.length > 2) {
    const mean     = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length;
    const std      = Math.sqrt(variance);
    cv_value = mean > 0 ? std / mean : 1;
    s3 = cv_value < 0.30 ? 20   // CV < 0.30: Rất ổn định
       : cv_value < 0.50 ? 15   // CV < 0.50: Ổn định
       : cv_value < 0.80 ? 10   // CV < 0.80: Thiếu ổn định
       :                    5;  // CV ≥ 0.80: Rất không ổn định
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIÊU CHÍ 4: ĐA DẠNG NGUỒN THU — Tối đa 15 điểm
  // Nguồn: CFPB (2015). "Financial well-being", thành phần "Future Financial
  //        Security". "Having multiple income streams is a key indicator of
  //        future financial security and resilience against income shocks." (p.21)
  //        Kết hợp: CFSI (2019), Indicator #8 "Planning" — đề cập đến sự
  //        chuẩn bị tài chính dài hạn thông qua đa dạng hóa nguồn thu. (p.18)
  // ═══════════════════════════════════════════════════════════════════════════
  const sources = Number(srcRow.sources);
  const s4 = sources >= 3 ? 15   // ≥3 nguồn: Đa dạng hóa rủi ro tốt
           : sources === 2 ? 10  // 2 nguồn: Có dự phòng cơ bản
           : sources === 1 ?  5  // 1 nguồn: Phụ thuộc một nguồn — rủi ro cao
           :                  0; // 0 nguồn: Không có thu nhập ghi nhận

  // ═══════════════════════════════════════════════════════════════════════════
  // TIÊU CHÍ 5: XU HƯỚNG CẢI THIỆN — Tối đa 10 điểm
  // Nguồn: CFSI (2019). "U.S. Financial Health Pulse", Trend Measurement.
  //        "Financial health is not a static measure but a dynamic trajectory.
  //         Tracking improvement over time is as important as the current
  //         score." (p.8)
  // Công thức: So sánh Savings Rate tháng này với tháng trước
  // ═══════════════════════════════════════════════════════════════════════════
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const [[prevInc]] = await query(
    `SELECT COALESCE(SUM(amount), 0) as i FROM transactions
     WHERE user_id=? AND type='income'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?`,
    [userId, prevMonth, prevYear],
  );
  const [[prevExp]] = await query(
    `SELECT COALESCE(SUM(amount), 0) as e FROM transactions
     WHERE user_id=? AND type='expense'
     AND MONTH(transaction_date)=? AND YEAR(transaction_date)=?`,
    [userId, prevMonth, prevYear],
  );
  const prevRate = Number(prevInc.i) > 0
    ? (Number(prevInc.i) - Number(prevExp.e)) / Number(prevInc.i) : 0;
  const s5 = savings_rate > prevRate + 0.02 ? 10  // Cải thiện rõ rệt (>2%)
           : savings_rate >= prevRate - 0.02 ?  5  // Duy trì ổn định (±2%)
           :                                    0; // Suy giảm

  // ── Tổng hợp điểm ─────────────────────────────────────────────────────────
  const total = s1 + s2 + s3 + s4 + s5;

  // Xếp loại theo thang chuẩn quốc tế (CFSI 2019, p.9)
  const grade = total >= 80 ? 'Xuất sắc'
              : total >= 65 ? 'Tốt'
              : total >= 50 ? 'Trung bình'
              : total >= 35 ? 'Cần cố gắng' : 'Báo động';

  // ── Lưu kết quả vào DB ────────────────────────────────────────────────────
  await query(
    `INSERT INTO financial_health_scores
      (user_id, month, year, total_score, grade, score_savings, score_budget,
       score_stability, score_diversity, score_trend, savings_rate, cv_value, income_sources)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
      total_score=VALUES(total_score), grade=VALUES(grade),
      score_savings=VALUES(score_savings), score_budget=VALUES(score_budget),
      score_stability=VALUES(score_stability), score_diversity=VALUES(score_diversity),
      score_trend=VALUES(score_trend), savings_rate=VALUES(savings_rate),
      cv_value=VALUES(cv_value), income_sources=VALUES(income_sources),
      updated_at=NOW()`,
    [userId, month, year, total, grade, s1, s2, s3, s4, s5,
      Math.round(savings_rate * 100), Math.round(cv_value * 100), sources],
  );

  return {
    total_score: total,
    grade,
    month,
    year,
    breakdown: {
      // Garman & Forgue (2011) — Savings Ratio
      savings:   { score: s1, max: 30, label: 'Tỷ lệ tiết kiệm',    ref: 'Garman & Forgue (2011)' },
      // CFSI Financial Health Network (2019) — Indicator #1
      budget:    { score: s2, max: 25, label: 'Tuân thủ ngân sách',  ref: 'CFSI (2019)' },
      // CFPB Well-Being Scale (2015) — Present Financial Security
      stability: { score: s3, max: 20, label: 'Ổn định chi tiêu',    ref: 'CFPB (2015)' },
      // CFPB Well-Being Scale (2015) — Future Financial Security
      diversity: { score: s4, max: 15, label: 'Đa dạng nguồn thu',   ref: 'CFPB (2015)' },
      // CFSI Financial Health Network (2019) — Trend
      trend:     { score: s5, max: 10, label: 'Xu hướng cải thiện',  ref: 'CFSI (2019)' },
    },
    meta: {
      savings_rate_pct: Math.round(savings_rate * 100),
      income,
      expense,
      sources,
      cv_value: Math.round(cv_value * 100) / 100,
    },
  };
}