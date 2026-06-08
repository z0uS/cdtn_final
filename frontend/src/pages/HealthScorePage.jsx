// pages/HealthScorePage.jsx
// Trang Điểm Sức Khoẻ Tài Chính

import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Heart, TrendingUp, RefreshCw, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// Màu theo điểm
const scoreColor = (score) => {
  if (score >= 80) return '#16A34A';
  if (score >= 65) return '#2563EB';
  if (score >= 50) return '#D97706';
  return '#DC2626';
};

const CRITERIA = [
  { key: 'savings',   icon: '💰', color: '#7C3AED', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { key: 'budget',    icon: '📋', color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30'   },
  { key: 'stability', icon: '📊', color: '#059669', bg: 'bg-green-100 dark:bg-green-900/30' },
  { key: 'diversity', icon: '🌱', color: '#D97706', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { key: 'trend',     icon: '📈', color: '#DC2626', bg: 'bg-red-100 dark:bg-red-900/30'     },
];

const GRADE_CONFIG = {
  'Xuất sắc':   { color: '#16A34A', emoji: '🏆', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  'Tốt':        { color: '#2563EB', emoji: '👍', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'     },
  'Trung bình': { color: '#D97706', emoji: '💪', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  'Cần cố gắng':{ color: '#EA580C', emoji: '⚠️', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' },
  'Báo động':   { color: '#DC2626', emoji: '🚨', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'         },
};

const HealthScorePage = () => {
  const [score, setScore]             = useState(null);
  const [history, setHistory]         = useState([]);
  const [analysis, setAnalysis]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Tháng/năm hiện tại
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    fetchData();
  }, []);

  // Animation đếm số lên
  useEffect(() => {
    if (!score) return;
    const target = score.total_score || 0;
    let current  = 0;
    const step   = Math.max(1, Math.ceil(target / 60));
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplayScore(current);
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scoreRes, historyRes] = await Promise.all([
        axiosInstance.get(`/v1/health-score?month=${month}&year=${year}`),
        axiosInstance.get('/v1/health-score/history'),
      ]);
      setScore(scoreRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch {
      toast.error('Không thể tải điểm sức khoẻ tài chính');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await axiosInstance.post(`/v1/health-score/recalculate?month=${month}&year=${year}`);
      setScore(res.data.data);
      setDisplayScore(0);
      toast.success('Đã tính lại điểm!');
      // Refresh history
      const histRes = await axiosInstance.get('/v1/health-score/history');
      setHistory(histRes.data.data || []);
    } catch {
      toast.error('Không thể tính lại lúc này');
    } finally {
      setRecalculating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!score?.breakdown) return;
    setLoadingPlan(true);
    try {
      const res = await axiosInstance.post('/v1/health-score/analyze', {
        breakdown:   score.breakdown,
        total_score: score.total_score,
      });
      setAnalysis(res.data.data);
      toast.success('Đã phân tích điểm số!');
    } catch {
      toast.error('Không thể phân tích lúc này');
    } finally {
      setLoadingPlan(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Đang tính điểm sức khoẻ...</p>
      </div>
    </div>
  );

  const color         = score ? scoreColor(score.total_score) : '#6366F1';
  const gradeConfig   = GRADE_CONFIG[score?.grade] || GRADE_CONFIG['Trung bình'];
  const prevScore     = score?.prev_score;
  const scoreDiff     = prevScore != null ? (score.total_score - prevScore) : null;
  const circumference = 2 * Math.PI * 70; // 439.82

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Sức khoẻ tài chính</h1>
            <p className="text-xs text-slate-400">Tháng {month}/{year}</p>
          </div>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
          Tính lại
        </button>
      </div>

      {/* ── Vòng tròn điểm ── */}
      <div className="card p-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Track */}
              <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {/* Progress */}
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - displayScore / 100)}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            {/* Số ở giữa */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums" style={{ color }}>{displayScore}</span>
              <span className="text-xs text-slate-400 mt-1">/ 100</span>
              <span className="text-sm font-bold mt-1" style={{ color }}>{score?.grade}</span>
            </div>
          </div>

          {/* Grade badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${gradeConfig.bg} mb-3`}>
            <span>{gradeConfig.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: gradeConfig.color }}>{score?.grade}</span>
          </div>

          {/* So sánh tháng trước */}
          {scoreDiff !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-500' : 'text-slate-400'
            }`}>
              {scoreDiff > 0 ? <ChevronUp className="w-3.5 h-3.5" /> : scoreDiff < 0 ? <ChevronDown className="w-3.5 h-3.5" /> : null}
              {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff < 0 ? scoreDiff : '='} điểm so với tháng trước
            </div>
          )}
        </div>
      </div>

      {/* ── Breakdown 5 tiêu chí ── */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Chi tiết 5 tiêu chí</h2>
        <div className="space-y-3">
          {CRITERIA.map(({ key, icon, color: c, bg }) => {
            const item = score?.breakdown?.[key];
            if (!item) return null;
            const pct = Math.round((item.score / item.max) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center text-sm`}>{icon}</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.score} <span className="text-slate-400 font-normal">/ {item.max}</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: c }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Biểu đồ lịch sử ── */}
      {history.length > 1 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lịch sử 6 tháng</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey={(d) => `T${d.month}`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v} điểm`, 'Sức khoẻ tài chính']}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="total_score"
                stroke="#7C3AED"
                strokeWidth={2.5}
                dot={({ cx, cy, payload }) => (
                  <circle key={`dot-${payload.month}`} cx={cx} cy={cy} r={5} fill={scoreColor(payload.total_score)} stroke="white" strokeWidth={2} />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Phân tích điểm số từ AI ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Phân tích chuyên sâu từ AI</h2>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loadingPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loadingPlan ? (
              <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {analysis ? 'Phân tích lại' : 'Bắt đầu phân tích'}
          </button>
        </div>

        {!analysis && !loadingPlan && (
          <p className="text-xs text-slate-400 text-center py-4">
            Nhấn "Bắt đầu phân tích" để AI giải thích chi tiết số điểm của bạn và đưa ra hướng cải thiện.
          </p>
        )}

        {loadingPlan && (
          <div className="flex justify-center py-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">AI đang đánh giá chi tiết tình hình tài chính...</p>
            </div>
          </div>
        )}

        {analysis && !loadingPlan && (
          <div className="space-y-4">
            {/* Tổng quan */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {analysis.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Điểm mạnh */}
              <div className="p-4 rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
                <h3 className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5 mb-2">
                  <span className="w-4 h-4 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-[10px]">✓</span>
                  Điểm sáng
                </h3>
                <ul className="space-y-1.5">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-5 relative">
                      <span className="absolute left-1.5 top-1.5 w-1 h-1 bg-green-400 rounded-full"></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Điểm yếu */}
              <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2">
                  <span className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-[10px]">!</span>
                  Cần lưu ý
                </h3>
                <ul className="space-y-1.5">
                  {analysis.weaknesses?.map((w, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-5 relative">
                      <span className="absolute left-1.5 top-1.5 w-1 h-1 bg-red-400 rounded-full"></span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Đề xuất */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-800">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Hướng cải thiện đề xuất
              </h3>
              <div className="space-y-2">
                {analysis.recommendations?.map((r, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5 leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthScorePage;
