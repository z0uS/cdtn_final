// api/aiApi.js
// AI Chat API – gọi qua backend (backend sẽ call Gemini)
// Không cần VITE_GEMINI_API_KEY nữa, API key được bảo mật ở backend

import axiosInstance from './axiosInstance';

// ── Conversations ─────────────────────────────────────────────

export const getConversationsApi = async () => {
  const res = await axiosInstance.get('/v1/ai/conversations');
  return res.data.data;
};

export const createConversationApi = async (title) => {
  const res = await axiosInstance.post('/v1/ai/conversations', { title });
  return res.data.data;
};

export const deleteConversationApi = async (id) => {
  const res = await axiosInstance.delete(`/v1/ai/conversations/${id}`);
  return res.data;
};

// ── Messages ──────────────────────────────────────────────────

export const getMessagesApi = async (conversationId) => {
  const res = await axiosInstance.get(`/v1/ai/conversations/${conversationId}/messages`);
  return res.data.data;
};

export const sendMessageApi = async (conversationId, content) => {
  const res = await axiosInstance.post(`/v1/ai/conversations/${conversationId}/messages`, {
    content,
  });
  // Backend trả: { success, data: { message: { role, content, ... } } }
  return res.data.data.message.content;
};

// ── Auto Analysis ─────────────────────────────────────────────

export const analyzeFinancesApi = async () => {
  const res = await axiosInstance.post('/v1/ai/analyze');
  return res.data.data.analysis;
};

// ── Legacy wrapper (tương thích component cũ dùng sendMessageToAI) ──
/**
 * @param {string} message
 * @param {Array}  history  - [{role, content}] - KHÔNG dùng nữa (backend tự load)
 * @param {Object} context  - Không cần, backend tự lấy từ DB
 * @param {string} conversationId - ID phiên chat hiện tại
 */
export const sendMessageToAI = async (message, history = [], context = {}, conversationId = null) => {
  // Nếu có conversationId → dùng API chat, không thì tạo phiên mới
  let convId = conversationId;

  if (!convId) {
    const newConv = await createConversationApi();
    convId = newConv.id;
  }

  return sendMessageApi(convId, message);
};
