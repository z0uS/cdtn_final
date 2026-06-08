// server.js
// Entry point: khởi động server + test DB + đăng ký cron jobs

import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { testConnection } from './src/config/db.js';
import { startRecurringJob } from './src/jobs/recurring.job.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Kiểm tra kết nối DB
  await testConnection();

  // Khởi động server
  app.listen(PORT, () => {
    console.log('');
    console.log('Web Quản Lý Chi Tiêu – Backend ');
    console.log(`Server: http://localhost:${PORT} `);
    console.log(`ENV:    ${(process.env.NODE_ENV || 'development')}`);
    console.log('');
    console.log('API Base URL: http://localhost:' + PORT + '/api/v1');
    console.log('Health Check: http://localhost:' + PORT + '/api/v1/health');
    console.log('');
  });

  // Đăng ký cron jobs
  startRecurringJob();
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
