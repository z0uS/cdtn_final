// src/config/db.js
// MySQL connection pool với mysql2

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'expense_management',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+07:00',
  charset:            'utf8mb4',
});

/**
 * Shorthand để chạy query với parameterized values (prepared statement)
 * Dùng cho INSERT, UPDATE, DELETE và SELECT không có LIMIT/OFFSET
 */
export const query = (sql, params = []) => pool.execute(sql, params);

/**
 * Dùng pool.query() thay vì pool.execute() cho SELECT có LIMIT/OFFSET
 * mysql2 prepared statements (execute) không chấp nhận LIMIT/OFFSET params
 * pool.query() dùng non-prepared, an toàn khi params đã được validate
 */
export const queryRaw = (sql, params = []) => pool.query(sql, params);

/**
 * Shorthand để lấy connection — dùng cho transaction DB
 * @returns {Promise<Connection>}
 */
export const getConnection = () => pool.getConnection();

/**
 * Kiểm tra kết nối khi khởi động server
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected:', process.env.DB_HOST, '/', process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
    process.exit(1);
  }
};

export default pool;
