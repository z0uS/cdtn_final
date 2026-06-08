// src/jobs/recurring.job.js
// Cron job: chạy 00:00 mỗi ngày để xử lý giao dịch định kỳ

import cron from 'node-cron';
import { query, getConnection } from '../config/db.js';
import { calcNextDate } from '../services/recurring.service.js';
import { formatDate } from '../utils/dateHelper.js';

const processRecurringTransactions = async () => {
  console.log('⏰ [Cron] Processing recurring transactions...');
  const conn = await getConnection();

  try {
    const today = formatDate(new Date());

    // Lấy tất cả giao dịch định kỳ đến hạn
    const [records] = await conn.execute(
      `SELECT rt.*, a.balance AS account_balance
       FROM recurring_transactions rt
       LEFT JOIN accounts a ON rt.account_id = a.id
       WHERE rt.is_active = 1 AND rt.next_date <= ?`,
      [today],
    );

    if (records.length === 0) {
      console.log('✅ [Cron] No recurring transactions due today.');
      conn.release();
      return;
    }

    console.log(`📋 [Cron] Found ${records.length} recurring transaction(s) to process.`);

    for (const rec of records) {
      try {
        await conn.beginTransaction();

        const parsedAmount  = parseFloat(rec.amount);
        const parsedBalance = parseFloat(rec.account_balance);
        const newBalance    = rec.type === 'income'
          ? parsedBalance + parsedAmount
          : parsedBalance - parsedAmount;

        // Tạo giao dịch
        await conn.execute(
          `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [rec.user_id, rec.account_id, rec.category_id, rec.type, parsedAmount,
           rec.description || 'Giao dịch định kỳ', today],
        );

        // Cập nhật balance tài khoản
        await conn.execute(
          'UPDATE accounts SET balance = ? WHERE id = ?',
          [newBalance, rec.account_id],
        );

        // Tính next_date mới
        const newNextDate = calcNextDate(rec.next_date, rec.frequency);
        await conn.execute(
          'UPDATE recurring_transactions SET next_date = ? WHERE id = ?',
          [newNextDate, rec.id],
        );

        // Tạo notification
        await conn.execute(
          `INSERT INTO notifications (user_id, title, message, type, related_id)
           VALUES (?, ?, ?, 'recurring', ?)`,
          [
            rec.user_id,
            'Giao dịch định kỳ đã được ghi nhận',
            `Đã tự động ghi nhận "${rec.description || 'Giao dịch định kỳ'}": ${parsedAmount.toLocaleString('vi-VN')}₫`,
            rec.id,
          ],
        );

        await conn.commit();
        console.log(`  ✅ Processed recurring #${rec.id} (${rec.description})`);
      } catch (recErr) {
        await conn.rollback();
        console.error(`  ❌ Failed recurring #${rec.id}:`, recErr.message);
      }
    }

    conn.release();
    console.log('✅ [Cron] Recurring transaction processing complete.');
  } catch (err) {
    conn.release();
    console.error('❌ [Cron] Error processing recurring transactions:', err);
  }
};

/**
 * Đăng ký cron job - chạy lúc 00:00 mỗi ngày
 */
export const startRecurringJob = () => {
  cron.schedule('0 0 * * *', processRecurringTransactions, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('✅ Recurring cron job scheduled (00:00 daily, GMT+7)');
};

export default startRecurringJob;
