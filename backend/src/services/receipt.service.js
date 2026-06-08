// src/services/receipt.service.js
// Phân tích ảnh hoá đơn bằng Gemini Vision

import fs from 'fs';
import { getModel } from '../config/ai.js';

const CATEGORY_HINTS = [
  'Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Sức khỏe',
  'Giáo dục', 'Hóa đơn & Tiện ích', 'Du lịch', 'Làm đẹp', 'Khác',
];

export async function analyzeReceipt(filePath) {
  try {
    const imageData   = fs.readFileSync(filePath);
    const base64Image = imageData.toString('base64');

    // Xác định mime type từ extension
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const model = getModel('gemini-flash-latest');
    if (!model) {
      return { success: false, message: 'AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.' };
    }

    const prompt = `Bạn là hệ thống OCR chuyên nghiệp phân tích hoá đơn/bill/receipt.
Hãy phân tích ảnh này và trả về ĐÚNG JSON object sau, KHÔNG kèm bất kỳ text nào khác, KHÔNG có markdown backticks:

{
  "is_receipt": true hoặc false,
  "confidence": số từ 0.0 đến 1.0,
  "store_name": "Tên cửa hàng hoặc null",
  "total_amount": 123456 (số nguyên VNĐ không dấu chấm phẩy) hoặc null,
  "currency": "VND",
  "transaction_date": "YYYY-MM-DD" hoặc null,
  "transaction_time": "HH:MM" hoặc null,
  "suggested_category": một trong ["Ăn uống","Di chuyển","Mua sắm","Giải trí","Sức khỏe","Giáo dục","Hóa đơn & Tiện ích","Du lịch","Làm đẹp","Khác"],
  "description": "Mô tả ngắn gọn ví dụ Bữa tối tại Nhà hàng ABC",
  "items": [
    { "name": "Tên món", "quantity": 1, "unit_price": 50000, "total": 50000 }
  ],
  "subtotal": null hoặc số,
  "tax": null hoặc số,
  "discount": null hoặc số,
  "payment_method": "Tiền mặt" hoặc "Thẻ" hoặc "Chuyển khoản" hoặc null,
  "notes": null
}

Quy tắc:
- Nếu đây KHÔNG phải hoá đơn: is_receipt = false, tất cả trường khác = null
- total_amount PHẢI là số nguyên dương, ví dụ 150000 chứ không phải chuỗi "150.000đ"
- Nếu không đọc được rõ một trường thì để null, đừng đoán bừa
- suggested_category phải ĐÚNG một trong danh sách đã cho`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Image } },
    ]);

    let responseText = result.response.text().trim();
    // Xử lý nếu Gemini vẫn wrap trong backticks
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    const parsed = JSON.parse(responseText);

    if (!parsed.is_receipt) {
      return { success: false, is_receipt: false, message: 'Không nhận diện được hoá đơn trong ảnh này' };
    }

    // Chuẩn hoá total_amount
    if (parsed.total_amount !== null && parsed.total_amount !== undefined) {
      parsed.total_amount = parseInt(String(parsed.total_amount).replace(/[^0-9]/g, ''), 10);
      if (isNaN(parsed.total_amount) || parsed.total_amount <= 0) parsed.total_amount = null;
    }

    return { success: true, data: parsed };

  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, message: 'Không thể đọc thông tin từ ảnh này. Vui lòng thử ảnh rõ hơn.' };
    }
    throw error;
  }
}
