// src/services/spendingMethod.service.js
// Business logic cho phương pháp phân bổ chi tiêu

import { query } from '../config/db.js';

/**
 * Lấy danh sách tất cả phương pháp (hệ thống + của user)
 */
export async function getMethods(userId) {
  const [methods] = await query(
    `SELECT * FROM spending_methods
     WHERE is_system = 1 OR user_id = ?
     ORDER BY is_system DESC, created_at ASC`,
    [userId],
  );

  // Gắn allocations vào từng method
  for (const m of methods) {
    const [allocs] = await query(
      `SELECT id, label, percentage, color, sort_order
       FROM method_allocations WHERE method_id = ? ORDER BY sort_order`,
      [m.id],
    );
    m.allocations = allocs;
  }

  return methods;
}

/**
 * Tạo phương pháp custom của user
 * allocations: [{ label, percentage, color }]
 */
export async function createMethod(userId, { name, description, icon, allocations }) {
  // Kiểm tra tổng % phải = 100
  const total = allocations.reduce((s, a) => s + Number(a.percentage), 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`Tổng phần trăm phải bằng 100%, hiện tại là ${total}%`);
  }

  const [result] = await query(
    `INSERT INTO spending_methods (user_id, name, description, icon, is_system)
     VALUES (?, ?, ?, ?, 0)`,
    [userId, name, description || '', icon || '📊'],
  );
  const methodId = result.insertId;

  for (let i = 0; i < allocations.length; i++) {
    const { label, percentage, color } = allocations[i];
    await query(
      `INSERT INTO method_allocations (method_id, label, percentage, color, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [methodId, label, percentage, color || '#2563EB', i + 1],
    );
  }

  return methodId;
}

/**
 * Xoá phương pháp custom (chỉ được xoá của chính mình)
 */
export async function deleteMethod(userId, methodId) {
  const [[m]] = await query(
    'SELECT id FROM spending_methods WHERE id = ? AND user_id = ? AND is_system = 0',
    [methodId, userId],
  );
  if (!m) throw new Error('Không tìm thấy phương pháp hoặc không có quyền xoá');
  await query('DELETE FROM spending_methods WHERE id = ?', [methodId]);
}

/**
 * Áp dụng phương pháp vào ngân sách tháng (sinh budgets tự động)
 * Chiến lược: map allocation.label → category có tên gần giống nhất
 * (thực tế user tự map qua categoryMappings: [{allocationLabel, categoryId}])
 */
/**
 * accountIds: optional number[] — danh sách ví/tài khoản được gắn với ngân sách
 */
export async function applyMethod(userId, { methodId, monthlyIncome, month, year, categoryMappings, accountIds }) {
  // Lấy allocations
  const [allocs] = await query(
    `SELECT ma.label, ma.percentage
     FROM method_allocations ma
     JOIN spending_methods sm ON sm.id = ma.method_id
     WHERE ma.method_id = ? AND (sm.is_system = 1 OR sm.user_id = ?)`,
    [methodId, userId],
  );
  if (allocs.length === 0) throw new Error('Không tìm thấy phương pháp');

  // Chuẩn hoá account_ids JSON
  const accountIdsJson = Array.isArray(accountIds) && accountIds.length > 0
    ? JSON.stringify(accountIds.map(Number))
    : null;

  // categoryMappings: [{ allocationLabel, categoryId }]
  const results = [];
  for (const mapping of categoryMappings) {
    const alloc = allocs.find((a) => a.label === mapping.allocationLabel);
    if (!alloc || !mapping.categoryId) continue;

    const budgetAmount = Math.round((Number(alloc.percentage) / 100) * monthlyIncome);

    // Upsert budget (tránh trùng)
    const [[existing]] = await query(
      `SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
      [userId, mapping.categoryId, month, year],
    );

    if (existing) {
      await query(
        `UPDATE budgets SET amount_limit = ?, account_ids = ? WHERE id = ?`,
        [budgetAmount, accountIdsJson, existing.id],
      );
      results.push({ categoryId: mapping.categoryId, amount: budgetAmount, action: 'updated' });
    } else {
      await query(
        `INSERT INTO budgets (user_id, category_id, amount_limit, month, year, account_ids) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, mapping.categoryId, budgetAmount, month, year, accountIdsJson],
      );
      results.push({ categoryId: mapping.categoryId, amount: budgetAmount, action: 'created' });
    }
  }
  return results;
}
