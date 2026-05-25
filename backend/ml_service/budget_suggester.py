# ml_service/budget_suggester.py
# Mô hình 2: Gợi ý hạn mức ngân sách thông minh
# Thuật toán: K-Means Clustering (Unsupervised Learning)

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os
from db_config import get_connection

MODEL_PATH  = "models/budget_kmeans.pkl"
SCALER_PATH = "models/budget_scaler.pkl"
STATS_PATH  = "models/budget_stats.pkl"

# Ngân sách mặc định (fallback khi không đủ dữ liệu)
DEFAULT_BUDGETS = {
    "Ăn uống":           3000000,
    "Di chuyển":         800000,
    "Mua sắm":           2000000,
    "Giải trí":          500000,
    "Sức khỏe":          300000,
    "Giáo dục":          500000,
    "Hóa đơn & Tiện ích": 1500000,
    "Làm đẹp":           400000,
    "Khác":              500000,
}

class BudgetSuggester:
    def __init__(self):
        self.kmeans  = None
        self.scaler  = None
        self.stats   = None   # Thống kê chi tiêu theo danh mục
        self.is_trained = False
        os.makedirs("models", exist_ok=True)

        if os.path.exists(MODEL_PATH):
            try:
                self.kmeans = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                self.stats  = joblib.load(STATS_PATH)
                self.is_trained = True
                print("📦 Đã load model gợi ý ngân sách từ file.")
            except:
                pass

    def _load_spending_data(self):
        """Lấy dữ liệu chi tiêu theo danh mục từ MySQL"""
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    c.name as category,
                    MONTH(t.transaction_date) as month,
                    YEAR(t.transaction_date) as year,
                    SUM(t.amount) as total_spent
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.type = 'expense'
                  AND t.transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY c.name, MONTH(t.transaction_date), YEAR(t.transaction_date)
                ORDER BY year, month
            """)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return pd.DataFrame(rows) if rows else pd.DataFrame()
        except Exception as e:
            print(f"⚠️  Không thể kết nối DB: {e}")
            return pd.DataFrame()

    def train(self):
        """Train K-Means để phân cụm hành vi chi tiêu"""
        df = self._load_spending_data()

        if df.empty or len(df) < 5:
            print("⚠️  Không đủ dữ liệu để train K-Means. Dùng ngân sách mặc định.")
            self.stats = DEFAULT_BUDGETS
            joblib.dump(self.stats, STATS_PATH)
            self.is_trained = True
            return

        # Pivot: category → cột, (month,year) → hàng
        pivot = df.pivot_table(
            index=['year', 'month'],
            columns='category',
            values='total_spent',
            aggfunc='sum',
            fill_value=0
        )

        # Tính thống kê mô tả cho từng danh mục
        category_stats = {}
        for col in pivot.columns:
            vals = pivot[col][pivot[col] > 0]
            if len(vals) > 0:
                category_stats[col] = {
                    "mean":   float(vals.mean()),
                    "median": float(vals.median()),
                    "max":    float(vals.max()),
                    "count":  len(vals),
                }

        self.stats = category_stats

        # K-Means chỉ chạy nếu có đủ hàng
        if len(pivot) >= 3:
            X = pivot.values
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)

            n_clusters = min(3, len(pivot))  # Tối đa 3 cụm
            self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            self.kmeans.fit(X_scaled)

            inertia = self.kmeans.inertia_
            print(f"[OK] K-Means trained: {n_clusters} cum, Inertia = {inertia:.2f}")

            joblib.dump(self.kmeans,  MODEL_PATH)
            joblib.dump(self.scaler,  SCALER_PATH)

        joblib.dump(self.stats, STATS_PATH)
        self.is_trained = True
        print(f"[OK] Budget Suggester da train voi {len(df)} ban ghi, {len(category_stats)} danh muc.")

    def suggest(self, user_id: int) -> dict:
        """Gợi ý ngân sách cho một user cụ thể"""
        if not self.is_trained:
            return {"suggestions": [], "error": "Model chưa được train"}

        # Lấy lịch sử chi tiêu riêng của user này
        user_stats = self._get_user_stats(user_id)
        suggestions = []

        if isinstance(self.stats, dict) and self.stats:
            for category, stat in self.stats.items():
                is_personal = False
                user_months = 0

                # Ưu tiên dữ liệu của user này nếu có
                if category in user_stats:
                    base = user_stats[category]["median"]
                    user_months = user_stats[category]["count"]
                    is_personal = True
                else:
                    if isinstance(stat, dict):
                        base = stat.get("median", stat.get("mean", 0))
                    else:
                        base = stat

                suggested = round(base * 1.1 / 50000) * 50000  # Làm tròn 50k
                suggested = max(suggested, 100000)              # Tối thiểu 100k

                suggestions.append({
                    "category":        category,
                    "suggested_limit": int(suggested),
                    "based_on_months": user_months,
                    "is_personal":     is_personal,
                    "your_avg":        int(user_stats.get(category, {}).get("mean", 0)),
                })
        else:
            # Fallback: dùng mặc định
            for category, amount in DEFAULT_BUDGETS.items():
                suggestions.append({
                    "category":        category,
                    "suggested_limit": amount,
                    "based_on_months": 0,
                    "is_personal":     False,
                    "your_avg":        0,
                })

        return {
            "user_id":     user_id,
            "suggestions": suggestions,
            "note":        "Gợi ý dựa trên phân tích lịch sử chi tiêu của bạn bằng K-Means Clustering"
        }

    def _get_user_stats(self, user_id: int) -> dict:
        """Lấy thống kê chi tiêu riêng của user"""
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    c.name as category,
                    AVG(monthly.total) as mean_spending,
                    MAX(monthly.total) as max_spending,
                    COUNT(monthly.total) as count_months
                FROM (
                    SELECT category_id,
                           SUM(amount) as total,
                           MONTH(transaction_date) as m,
                           YEAR(transaction_date) as y
                    FROM transactions
                    WHERE user_id = %s AND type = 'expense'
                    GROUP BY category_id, m, y
                ) monthly
                JOIN categories c ON c.id = monthly.category_id
                GROUP BY c.name
            """, (user_id,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return {
                r['category']: {
                    "mean":   float(r['mean_spending'] or 0),
                    "median": float(r['mean_spending'] or 0),
                    "count":  int(r['count_months'] or 0),
                }
                for r in rows
            }
        except Exception:
            return {}
