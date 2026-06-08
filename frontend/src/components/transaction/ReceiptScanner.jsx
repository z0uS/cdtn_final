// components/transaction/ReceiptScanner.jsx
// Component quét ảnh hoá đơn & tự động điền form

import { useState, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, X, ScanLine } from 'lucide-react';

// step: 'idle' | 'preview' | 'scanning' | 'result' | 'error'

const ReceiptScanner = ({ onResult, onClose }) => {
  const [step, setStep] = useState('idle');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const formatVND = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
      setStep('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ảnh quá lớn. Tối đa 10MB.');
      setStep('error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleScan = async () => {
    setStep('scanning');
    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const res = await axiosInstance.post('/v1/receipts/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 40000,
      });
      setScanResult(res.data.data);
      setStep('result');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi phân tích ảnh');
      setStep('error');
    }
  };

  const handleUseResult = () => {
    onResult({
      amount: scanResult.total_amount,
      description: scanResult.description || scanResult.store_name || '',
      transaction_date: scanResult.transaction_date || new Date().toISOString().split('T')[0],
      suggested_category: scanResult.suggested_category,
      image_url: scanResult.image_url,
      note: scanResult.items?.length
        ? 'Items: ' + scanResult.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
        : '',
    });
    onClose();
  };

  const reset = () => {
    setStep('idle');
    setPreviewUrl(null);
    setSelectedFile(null);
    setScanResult(null);
    setErrorMsg('');
  };

  // ── IDLE: Kéo thả hoặc chọn ảnh ──────────────────────────────
  if (step === 'idle') return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={[
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800',
        ].join(' ')}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ScanLine className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Kéo & thả ảnh hoá đơn vào đây
            </p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · Tối đa 10MB</p>
          </div>
        </div>
      </div>

      {/* 2 nút */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Chọn ảnh
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-sm font-medium"
        >
          <Camera className="w-4 h-4" />
          Chụp ảnh
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
    </div>
  );

  // ── PREVIEW: Hiển thị ảnh + nút quét ─────────────────────────
  if (step === 'preview') return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={previewUrl} alt="Hoá đơn" className="w-full max-h-64 object-contain" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={reset}
          className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-sm font-medium transition-all"
        >
          Chọn lại
        </button>
        <button
          onClick={handleScan}
          className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <ScanLine className="w-4 h-4" />
          Quét hoá đơn
        </button>
      </div>
    </div>
  );

  // ── SCANNING: Loading overlay ─────────────────────────────────
  if (step === 'scanning') return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={previewUrl} alt="Hoá đơn" className="w-full max-h-64 object-contain opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full">
            Hệ thống đang phân tích...
          </p>
        </div>
      </div>
      <p className="text-xs text-center text-slate-400">Có thể mất 5–15 giây</p>
    </div>
  );

  // ── RESULT: Hiển thị kết quả ─────────────────────────────────
  if (step === 'result' && scanResult) {
    const confidence = scanResult.confidence || 0;
    const confColor = confidence >= 0.8 ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Đọc hoá đơn thành công</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confColor}`}>
            {Math.round(confidence * 100)}% chính xác
          </span>
        </div>

        {/* Cảnh báo độ chính xác thấp */}
        {confidence < 0.75 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Độ chính xác chưa cao — hãy kiểm tra lại thông tin trước khi sử dụng
            </p>
          </div>
        )}

        {/* Grid thông tin */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Cửa hàng" value={scanResult.store_name} />
          <InfoItem
            label="Tổng tiền"
            value={formatVND(scanResult.total_amount)}
            highlight
          />
          <InfoItem label="Ngày" value={scanResult.transaction_date} />
          <InfoItem label="Danh mục" value={scanResult.suggested_category} />
          <InfoItem label="Thanh toán" value={scanResult.payment_method} className="col-span-2" />
        </div>

        {/* Danh sách món (collapsible) */}
        {scanResult.items?.length > 0 && (
          <details className="rounded-xl border border-slate-200 dark:border-slate-700">
            <summary className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              Chi tiết {scanResult.items.length} món
            </summary>
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="text-slate-400 border-b dark:border-slate-700">
                    <th className="text-left pb-1">Tên</th>
                    <th className="text-right pb-1">SL</th>
                    <th className="text-right pb-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResult.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1 text-slate-700 dark:text-slate-300">{item.name}</td>
                      <td className="py-1 text-right text-slate-500">x{item.quantity}</td>
                      <td className="py-1 text-right text-slate-700 dark:text-slate-300">{formatVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={reset}
            className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Quét lại
          </button>
          <button
            onClick={handleUseResult}
            disabled={!scanResult.total_amount}
            className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dùng thông tin này
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR: Hiển thị lỗi ───────────────────────────────────────
  if (step === 'error') return (
    <div className="space-y-4 text-center">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <X className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Không thể đọc hoá đơn</p>
          <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
        </div>
      </div>
      <button
        onClick={reset}
        className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
      >
        Thử lại
      </button>
    </div>
  );

  return null;
};

// Helper component
const InfoItem = ({ label, value, highlight, className = '' }) => (
  <div className={`rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 ${className}`}>
    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
    <p className={`text-sm font-semibold mt-0.5 ${highlight
        ? 'text-indigo-600 dark:text-indigo-400 text-base'
        : 'text-slate-800 dark:text-slate-200'
      } ${!value ? 'text-slate-400 font-normal' : ''}`}>
      {value || '—'}
    </p>
  </div>
);

export default ReceiptScanner;
