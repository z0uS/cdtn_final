// pages/AiChatPage.jsx
// Giao diện chat AI tư vấn tài chính — cá nhân hoá theo dữ liệu thực (v2)

import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Send, Bot, Sparkles, Plus, Trash2, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// Format số tiền nổi bật trong câu trả lời AI
const formatAiText = (text) =>
  text
    .replace(/(\d{1,3}(?:[.,]\d{3})*)(đ|VNĐ|vnđ|₫)/g,
      '<span class="font-semibold text-orange-500">$1$2</span>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

// ── Components nhỏ ─────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="flex gap-3 items-end animate-fade-in">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-white dark:bg-dark-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1.5 items-center h-4">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const ChatMessage = ({ msg }) => {
  const isAI = msg.role === 'assistant';
  const { user } = useAuthStore();
  
  return (
    <div className={`flex gap-3 items-end ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${user.avatar}`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
      )}
      <div className={`max-w-[80%] ${isAI ? '' : ''}`}>
        <div
          className={[
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isAI
              ? 'bg-white dark:bg-dark-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-sm shadow-sm'
              : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm shadow-sm',
          ].join(' ')}
          dangerouslySetInnerHTML={{ __html: formatAiText(msg.content) }}
        />
        <p className={`text-[10px] text-slate-400 mt-1 ${isAI ? '' : 'text-right'}`}>
          {msg.created_at ? dayjs(msg.created_at).format('HH:mm') : dayjs().format('HH:mm')}
        </p>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────

const AiChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [suggestions, setSuggestions]     = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Tải conversations + suggestions khi mount
  useEffect(() => {
    loadConversations();
    loadSuggestions();
  }, []);

  // Tải tin nhắn khi chọn conversation
  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  // Auto-scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await axiosInstance.get('/v1/ai/conversations');
      setConversations(res.data.data || []);
    } catch {
      // Bỏ qua lỗi load conversations
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res = await axiosInstance.get('/v1/ai/suggestions');
      setSuggestions(res.data.data || []);
    } catch {
      // Fallback suggestions
      setSuggestions([
        'Tháng này tôi chi tiêu hợp lý chưa?',
        'Tôi nên cắt giảm chi tiêu ở đâu?',
        'Gợi ý cách tiết kiệm hiệu quả hơn',
        'Phân tích ngân sách của tôi',
        'Tháng tới tôi cần chú ý điều gì?',
      ]);
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await axiosInstance.get(`/v1/ai/conversations/${id}/messages`);
      setMessages(res.data.data || []);
    } catch {
      toast.error('Không thể tải tin nhắn');
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await axiosInstance.post('/v1/ai/conversations', { title: 'Cuộc trò chuyện mới' });
      const newConv = res.data.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch {
      toast.error('Không thể tạo cuộc trò chuyện mới');
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/v1/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      toast.success('Đã xoá cuộc trò chuyện');
    } catch {
      toast.error('Không thể xoá cuộc trò chuyện');
    }
  };

  const handleSend = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    // Tạo conversation mới nếu chưa có
    let convId = activeId;
    if (!convId) {
      try {
        const res = await axiosInstance.post('/v1/ai/conversations', { title: content.slice(0, 40) });
        convId = res.data.data.id;
        setConversations((prev) => [res.data.data, ...prev]);
        setActiveId(convId);
      } catch {
        toast.error('Không thể tạo cuộc trò chuyện');
        return;
      }
    }

    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post(`/v1/ai/conversations/${convId}/messages`, { content });
      const aiMsg = res.data.data?.message || res.data.data;
      setMessages((prev) => [...prev, { ...aiMsg, created_at: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Có lỗi xảy ra khi kết nối AI. Vui lòng thử lại.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/v1/ai/quick-analysis');
      const { conversation_id, message } = res.data.data;
      await loadConversations();
      setActiveId(conversation_id);
      setMessages([{ ...message, created_at: new Date().toISOString() }]);
      toast.success('Đã phân tích xong!');
    } catch {
      toast.error('Không thể phân tích lúc này');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-var(--navbar-height)-3rem)] -mx-4 sm:-mx-6 lg:-mx-8 bg-slate-50 dark:bg-dark-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-card">

      {/* ── Sidebar conversations ── */}
      <div className="w-60 flex-shrink-0 bg-white dark:bg-dark-800 border-r border-slate-100 dark:border-slate-700 flex flex-col">
        {/* Header sidebar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Chat mới
          </button>
        </div>

        {/* List conversations */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-8 px-2">
              Chưa có cuộc trò chuyện nào. Bắt đầu chat!
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={[
                  'group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-sm transition-all',
                  activeId === c.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400',
                ].join(' ')}
              >
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate text-xs font-medium">{c.title}</span>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Khu vực chat chính ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header chat */}
        <div className="bg-white dark:bg-dark-800 border-b border-slate-100 dark:border-slate-700 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Trợ lý tài chính AI</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-slate-400">Đã được cấp dữ liệu tài chính thực</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleQuickAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phân tích tháng này</span>
            <span className="sm:hidden">Phân tích</span>
          </button>
        </div>

        {/* Tin nhắn */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Hỏi tôi bất cứ điều gì về tài chính</p>
                <p className="text-xs text-slate-400 mt-1">Tôi đã được cung cấp dữ liệu chi tiêu thực của bạn</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions + Input */}
        <div className="bg-white dark:bg-dark-800 border-t border-slate-100 dark:border-slate-700 p-4 flex-shrink-0">
          {/* Câu gợi ý cá nhân hoá */}
          {messages.length === 0 && suggestions.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi về tài chính của bạn... (Enter để gửi)"
              className="flex-1 resize-none input-base py-2.5 max-h-32 overflow-y-auto text-sm"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-default flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            AI có thể mắc lỗi. Hãy xác minh thông tin quan trọng với chuyên gia tài chính.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
