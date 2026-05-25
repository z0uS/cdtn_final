# ml_service/db_config.py
# Cấu hình kết nối MySQL - đọc từ biến môi trường hoặc dùng mặc định

import mysql.connector

DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",
    "password": "123456",
    "database": "expense_management",
    "charset":  "utf8mb4",
}

def get_connection():
    """Tạo kết nối mới đến MySQL"""
    return mysql.connector.connect(**DB_CONFIG)
