// src/middlewares/errorHandler.middleware.js
// Global error handler – bắt tất cả lỗi chưa được xử lý

const errorHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log chi tiết trong development
  if (isDev) {
    console.error('❌ Unhandled Error:', err);
  }

  // Xác định status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';

  const payload = {
    success: false,
    message,
  };

  // Chỉ kèm stack trace trong development
  if (isDev) {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
};

export default errorHandler;
