// src/controllers/ai.controller.js
import { query } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { buildSystemPrompt, callAI } from '../services/ai.service.js';
import { buildUserFinancialContext, buildEnhancedSystemPrompt, generateSuggestions } from '../services/aiContext.service.js';

// ── GET /ai/conversations ────────────────────────────────────
export const getConversations = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, title, created_at, updated_at FROM ai_conversations
       WHERE user_id = ? ORDER BY updated_at DESC`,
      [req.user.id],
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// ── POST /ai/conversations ───────────────────────────────────
export const createConversation = async (req, res, next) => {
  try {
    const title = req.body.title || `Cuộc trò chuyện ${new Date().toLocaleDateString('vi-VN')}`;

    const [result] = await query(
      'INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)',
      [req.user.id, title],
    );

    const [[row]] = await query('SELECT * FROM ai_conversations WHERE id = ?', [result.insertId]);
    return success(res, row, 'Tạo cuộc trò chuyện mới thành công!', 201);
  } catch (err) { next(err); }
};

// ── GET /ai/conversations/:id/messages ───────────────────────
export const getMessages = async (req, res, next) => {
  try {
    // Kiểm tra conversation thuộc user
    const [[conv]] = await query(
      'SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!conv) return error(res, 'Không tìm thấy cuộc trò chuyện.', 404);

    const [rows] = await query(
      'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [req.params.id],
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// ── POST /ai/conversations/:id/messages ──────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return error(res, 'Nội dung tin nhắn không được để trống.', 400);
    }

    // Kiểm tra conversation
    const [[conv]] = await query(
      'SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!conv) return error(res, 'Không tìm thấy cuộc trò chuyện.', 404);

    // Lấy lịch sử chat (tối đa 20 tin nhắn gần nhất)
    const [history] = await query(
      `SELECT role, content FROM ai_messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [req.params.id],
    );
    const historyOrdered = history.reverse();

    // Lưu user message
    await query(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [req.params.id, 'user', content.trim()],
    );

    // Build system prompt từ dữ liệu tài chính thực
    const systemPrompt = await buildSystemPrompt(req.user.id);

    // Gọi AI
    const aiResponse = await callAI(systemPrompt, historyOrdered, content.trim());

    // Lưu assistant message
    const [result] = await query(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [req.params.id, 'assistant', aiResponse],
    );

    // Cập nhật updated_at của conversation
    await query('UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?', [req.params.id]);

    const [[savedMsg]] = await query('SELECT * FROM ai_messages WHERE id = ?', [result.insertId]);
    return success(res, { message: savedMsg }, 'Phản hồi từ AI!');
  } catch (err) { next(err); }
};

// ── POST /ai/analyze ─────────────────────────────────────────
export const analyzefinances = async (req, res, next) => {
  try {
    const systemPrompt = await buildSystemPrompt(req.user.id);
    const prompt = 'Hãy phân tích và tóm tắt tình hình tài chính của tôi tháng này. Đưa ra nhận xét và 3 lời khuyên cụ thể nhất.';

    const analysis = await callAI(systemPrompt, [], prompt);
    return success(res, { analysis });
  } catch (err) { next(err); }
};

// ── DELETE /ai/conversations/:id ─────────────────────────────
export const deleteConversation = async (req, res, next) => {
  try {
    const [[conv]] = await query(
      'SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!conv) return error(res, 'Không tìm thấy cuộc trò chuyện.', 404);

    await query('DELETE FROM ai_conversations WHERE id = ?', [req.params.id]);
    return success(res, null, 'Xóa cuộc trò chuyện thành công!');
  } catch (err) { next(err); }
};

// ── POST /ai/quick-analysis ──────────────────────────────────
export const quickAnalysis = async (req, res, next) => {
  try {
    const context      = await buildUserFinancialContext(req.user.id);
    const systemPrompt = buildEnhancedSystemPrompt(context);

    // Tạo conversation mới
    const [result] = await query(
      'INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)',
      [req.user.id, `Phân tích tháng ${context.month}/${context.year}`],
    );
    const convId = result.insertId;

    const userMsg = 'Hãy phân tích tổng quan tình hình tài chính của tôi trong tháng này và đưa ra 3 gợi ý cải thiện cụ thể.';

    await query(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'user', userMsg],
    );

    const aiResponse = await callAI(systemPrompt, [], userMsg);

    await query(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'assistant', aiResponse],
    );
    await query('UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?', [convId]);

    return success(res, {
      conversation_id: convId,
      message: { role: 'assistant', content: aiResponse },
    });
  } catch (err) { next(err); }
};

// ── GET /ai/suggestions ───────────────────────────────────────
export const getSuggestions = async (req, res, next) => {
  try {
    const context     = await buildUserFinancialContext(req.user.id);
    const suggestions = await generateSuggestions(context);
    return success(res, suggestions);
  } catch (err) { next(err); }
};
