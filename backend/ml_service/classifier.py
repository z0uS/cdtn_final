# ml_service/classifier.py
# Mô hình 1: Phân loại danh mục giao dịch tự động
# Thuật toán: TF-IDF + Multinomial Naive Bayes (Supervised Learning)

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import unicodedata
import joblib
import os
import re
from db_config import get_connection

def normalize_text(text: str) -> str:
    """Chuyen ve chu thuong, bo dau tieng Viet, giu lai chu so va chu cai"""
    if not text:
        return ""
    text = text.lower().strip()
    # Bo dau tieng Viet bang NFD decomposition
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    # Giu lai chu, so, khoang trang
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# ── Dữ liệu bổ sung (Synthetic Data) để tăng chất lượng model ──
# Kỹ thuật Data Augmentation – các từ khóa điển hình cho từng danh mục
# Lưu ý: tên danh mục phải KHỚP CHÍNH XÁC với cột name trong bảng categories
SYNTHETIC_DATA = [
    # ══ Ăn uống ══
    ("grab food đặt cơm", "Ăn uống"),
    ("shopee food pizza domino", "Ăn uống"),
    ("bún bò huế phở bò tái", "Ăn uống"),
    ("coffee highlands phúc long", "Ăn uống"),
    ("trà sữa gong cha koi thé tiger sugar", "Ăn uống"),
    ("ăn sáng bánh mì xôi hủ tiếu", "Ăn uống"),
    ("ăn trưa cơm văn phòng bình dân", "Ăn uống"),
    ("ăn tối nhà hàng buffet", "Ăn uống"),
    ("lẩu hải sản nướng bbq", "Ăn uống"),
    ("kfc gà rán burger king jollibee", "Ăn uống"),
    ("mcdonalds burger mcnuggets", "Ăn uống"),
    ("baemin shopeefood giao đồ ăn tối", "Ăn uống"),
    ("cà phê sáng americano latte", "Ăn uống"),
    ("buffet sushi nướng kbbq", "Ăn uống"),
    ("snack bánh kẹo đồ ăn vặt", "Ăn uống"),
    ("tiệc liên hoan nhậu bia", "Ăn uống"),
    ("nước ép sinh tố trái cây", "Ăn uống"),
    ("pizza 4ps đặt giao", "Ăn uống"),
    ("cháo sườn lòng cá", "Ăn uống"),
    ("bánh cuốn bánh ướt bánh xèo", "Ăn uống"),
    ("cơm tấm sườn bì chả", "Ăn uống"),
    ("mì quảng bún riêu bún chả", "Ăn uống"),
    ("cơm gà hải nam cơm niêu", "Ăn uống"),
    ("ramen mì ý pasta nhật", "Ăn uống"),
    ("ăn tối cuối tuần gia đình", "Ăn uống"),

    # ══ Di chuyển ══
    ("grab bike xe máy đi làm", "Di chuyển"),
    ("be taxi grab car ô tô", "Di chuyển"),
    ("xăng xe đổ xăng petrolimex shell", "Di chuyển"),
    ("vé xe buýt brt tuyến", "Di chuyển"),
    ("bãi giữ xe gửi xe tầng hầm", "Di chuyển"),
    ("vé máy bay vietjet bamboo vietnam airlines", "Di chuyển"),
    ("taxi sân bay tsn nội bài", "Di chuyển"),
    ("sửa xe thay dầu nhớt lốp xe", "Di chuyển"),
    ("vé xe khách limousine phương trang", "Di chuyển"),
    ("rửa xe bảo dưỡng xe máy", "Di chuyển"),
    ("phí đường cao tốc epass", "Di chuyển"),
    ("xe ôm grab bike di chuyển", "Di chuyển"),

    # ══ Mua sắm ══
    ("shopee lazada mua hàng online", "Mua sắm"),
    ("tiktok shop đặt hàng", "Mua sắm"),
    ("quần áo giày dép áo khoác", "Mua sắm"),
    ("điện thoại laptop máy tính ipad", "Mua sắm"),
    ("siêu thị vinmart coopmart big c", "Mua sắm"),
    ("nội thất đồ gia dụng bàn ghế", "Mua sắm"),
    ("điện máy xanh nguyễn kim thienminhobile", "Mua sắm"),
    ("đồ chơi lego toy mô hình", "Mua sắm"),
    ("lego xếp hình mô hình đồ chơi trẻ em", "Mua sắm"),
    ("túi xách balo ví da", "Mua sắm"),
    ("túi sách túi tote túi đeo", "Mua sắm"),
    ("đồng hồ phụ kiện trang sức dây chuyền", "Mua sắm"),
    ("uniqlo zara h&m thời trang", "Mua sắm"),
    ("sạc dây cáp phụ kiện điện thoại anker", "Mua sắm"),
    ("loa tai nghe bluetooth sony", "Mua sắm"),
    ("nồi nước đun ấm đồ bếp bát đĩa", "Mua sắm"),
    ("đồ dùng văn phòng phẩm bút sổ", "Mua sắm"),
    ("mỹ phẩm skincare the face shop innisfree", "Mua sắm"),
    ("robot hút bụi máy giặt thiết bị nhà", "Mua sắm"),
    ("quần jean levi's jeans thể thao nike adidas", "Mua sắm"),
    ("áo sơ mi áo thun quần short", "Mua sắm"),
    ("đèn bàn đèn led trang trí phòng", "Mua sắm"),
    ("phụ kiện máy tính bàn phím chuột", "Mua sắm"),

    # ══ Giải trí ══
    ("xem phim cgv bhd lotte rạp chiếu", "Giải trí"),
    ("netflix youtube premium gia hạn", "Giải trí"),
    ("spotify apple music canva pro", "Giải trí"),
    ("game steam nintendo switch playstation dlc", "Giải trí"),
    ("karaoke hát phòng vip", "Giải trí"),
    ("bowling bi-da billiard miniature golf", "Giải trí"),
    ("vé concert show âm nhạc sơn tùng", "Giải trí"),
    ("escape room vui chơi giải trí", "Giải trí"),
    ("vé kịch sân khấu idecaf", "Giải trí"),
    ("tour tham quan dinh độc lập bảo tàng", "Giải trí"),
    ("mua sách truyện tranh manga", "Giải trí"),

    # ══ Sức khỏe ══
    ("khám bệnh bệnh viện phòng khám", "Sức khỏe"),
    ("thuốc tây nhà thuốc pharmacity long châu", "Sức khỏe"),
    ("gym tập thể dục california fitness", "Sức khỏe"),
    ("yoga pilates studio", "Sức khỏe"),
    ("nha sĩ khám răng lấy cao", "Sức khỏe"),
    ("bảo hiểm y tế sức khỏe", "Sức khỏe"),
    ("vitamin thuốc bổ collagen zinc", "Sức khỏe"),
    ("xét nghiệm máu khám tổng quát", "Sức khỏe"),
    ("kem chống nắng xịt khoáng dưỡng da", "Sức khỏe"),
    ("massage thư giãn spa sức khỏe", "Sức khỏe"),
    ("máy đo huyết áp omron thiết bị y tế", "Sức khỏe"),
    ("khám da liễu mắt kính áp tròng", "Sức khỏe"),

    # ══ Giáo dục ══
    ("học phí khóa học trung tâm", "Giáo dục"),
    ("khóa học online udemy coursera", "Giáo dục"),
    ("sách giáo trình tài liệu học", "Giáo dục"),
    ("tiếng anh ielts toeic thi", "Giáo dục"),
    ("học lập trình python javascript", "Giáo dục"),
    ("aws cloud chứng chỉ exam", "Giáo dục"),
    ("excel power bi data analytics", "Giáo dục"),
    ("thi thử ôn thi học thêm", "Giáo dục"),
    ("figma ui ux design kyna", "Giáo dục"),
    ("machine learning ai coursera", "Giáo dục"),

    # ══ Hóa đơn ══
    ("tiền điện hóa đơn evn", "Hóa đơn"),
    ("tiền nước hóa đơn cấp nước", "Hóa đơn"),
    ("internet wifi fpt vnpt viettel", "Hóa đơn"),
    ("gói điện thoại viettel vinaphone data", "Hóa đơn"),
    ("phí quản lý chung cư dịch vụ", "Hóa đơn"),
    ("nạp điện trả trước prepaid", "Hóa đơn"),
    ("vệ sinh điều hòa sửa điện nước", "Hóa đơn"),

    # ══ Nhà ở ══
    ("tiền thuê nhà phòng trọ chủ nhà", "Nhà ở"),
    ("mua đồ nội thất phòng ngủ", "Nhà ở"),
    ("đèn led trang trí phòng mua", "Nhà ở"),
    ("vệ sinh nhà cửa dọn dẹp", "Nhà ở"),
    ("sửa điện nước thợ", "Nhà ở"),
    ("đồ dùng nhà bếp nồi chảo bát đĩa", "Nhà ở"),
    ("tủ đựng quần áo giá kệ", "Nhà ở"),

    # ══ Làm đẹp ══
    ("cắt tóc nhuộm tóc barber", "Làm đẹp"),
    ("kem dưỡng da serum the ordinary", "Làm đẹp"),
    ("spa chăm sóc da mặt mặt nạ", "Làm đẹp"),
    ("tẩy tế bào chết wax lông", "Làm đẹp"),
    ("kem chống nắng dưỡng ẩm làm đẹp", "Làm đẹp"),
    ("cạo râu dưỡng tóc barber shop", "Làm đẹp"),
    ("nail móng tay làm đẹp tiệm", "Làm đẹp"),
    ("bộ dưỡng tóc tresemme duỗi tóc", "Làm đẹp"),

    # ══ Du lịch ══
    ("khách sạn resort hotel booking", "Du lịch"),
    ("vé tham quan du lịch tour", "Du lịch"),
    ("đà lạt đà nẵng hà nội phú quốc", "Du lịch"),
    ("homestay airbnb đặt phòng", "Du lịch"),
    ("ăn uống du lịch tham quan", "Du lịch"),
    ("vé cáp treo vườn thú bảo tàng", "Du lịch"),
    ("chuyến đi trip cuối tuần", "Du lịch"),
    ("khách sạn 2 đêm 3 ngày", "Du lịch"),

    # ══ Quà tặng ══
    ("quà sinh nhật tặng bạn thân", "Quà tặng"),
    ("hoa tươi hoa hồng tặng", "Quà tặng"),
    ("lì xì tết quà tặng bao lì xì", "Quà tặng"),
    ("quà 8 tháng 3 valentine ngày lễ", "Quà tặng"),
    ("mua quà cho ba mẹ gia đình người thân", "Quà tặng"),
    ("bánh kem sinh nhật mừng", "Quà tặng"),
    ("sôcôla chocolate tặng người yêu", "Quà tặng"),
    ("túi xách ví tặng quà", "Quà tặng"),
    ("gửi quà bưu điện tặng", "Quà tặng"),

    # ══ Chi khác ══
    ("photocopy in ấn tài liệu", "Chi khác"),
    ("phí atm rút tiền ngân hàng ngoại mạng", "Chi khác"),
    ("phí chuyển tiền dịch vụ swift", "Chi khác"),
    ("mua văn phòng phẩm bút sổ kẹp", "Chi khác"),
    ("phí đỗ xe tháng bãi giữ xe", "Chi khác"),
    ("đổi gas bình gas đại lý", "Chi khác"),
    ("phí dịch vụ thẻ ngân hàng", "Chi khác"),

    # ══ Thu nhập – các danh mục income ══
    ("lương tháng nhận lương cơ bản", "Lương"),
    ("lương tháng 2 3 4 5 công ty", "Lương"),
    ("thưởng kpi bonus hiệu suất", "Thưởng"),
    ("thưởng tết thưởng dự án xuất sắc", "Thưởng"),
    ("freelance dự án thiết kế website", "Freelance"),
    ("freelance app mobile react native", "Freelance"),
    ("đầu tư chứng khoán cổ tức vnm", "Đầu tư"),
    ("lãi tiết kiệm ngân hàng mb", "Đầu tư"),
    ("quà nhận lì xì quà tặng nhận", "Quà nhận"),
    ("thu khác bán đồ cũ cashback hoàn tiền", "Thu khác"),
    ("bán laptop điện thoại cũ", "Thu khác"),
]

MODEL_PATH = "models/classifier.pkl"

class CategoryClassifier:
    def __init__(self):
        self.pipeline = None
        self.is_trained = False
        os.makedirs("models", exist_ok=True)

        # Load model đã train nếu có
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                self.is_trained = True
                print("[OK] Da load model phan loai tu file.")
            except:
                pass

    def _load_from_db(self):
        """Lấy dữ liệu từ MySQL – kết hợp description + note để có nhiều từ khóa hơn"""
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    TRIM(CONCAT(
                        COALESCE(t.description, ''),
                        ' ',
                        COALESCE(t.note, '')
                    )) AS text,
                    c.name AS category
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE (
                    (t.description IS NOT NULL AND t.description != '')
                    OR (t.note IS NOT NULL AND t.note != '')
                )
                AND c.name IS NOT NULL
            """)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            result = [(r['text'].strip(), r['category']) for r in rows if r['text'].strip()]
            print(f"[DB] Da load {len(result)} ban ghi tu DB de train.")
            return result
        except Exception as e:
            print(f"[WARNING] Khong the ket noi DB: {e}. Dung du lieu synthetic.")
            return []

    def train(self):
        """Train model Naive Bayes với dữ liệu DB + Synthetic"""
        db_data = self._load_from_db()
        all_data = db_data + SYNTHETIC_DATA

        if len(all_data) < 10:
            print(f"[WARNING] Qua it du lieu, dung toan bo synthetic data.")
            all_data = SYNTHETIC_DATA

        df = pd.DataFrame(all_data, columns=['description', 'category'])
        df = df.drop_duplicates().dropna()

        # Chuan hoa text: bo dau, lowercase (giup xu ly ca input co dau lan khong dau)
        X = [normalize_text(t) for t in df['description'].tolist()]
        y = df['category'].tolist()

        print(f"[TRAIN] Tong mau train: {len(X)} | So danh muc: {len(set(y))}")

        # Tạo Pipeline: TF-IDF → Naive Bayes
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 2),   # Dùng cả unigram và bigram
                max_features=8000,    # Tăng từ 5000 lên để bắt được nhiều từ hơn
                min_df=1,
                sublinear_tf=True,    # Log-scaling giúp giảm ảnh hưởng của từ quá phổ biến
            )),
            ('clf', MultinomialNB(alpha=0.1)),  # Alpha nhỏ hơn = ít làm mịn hơn = phân biệt rõ hơn
        ])

        # Đánh giá model nếu đủ dữ liệu
        if len(X) > 20:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=None
            )
            self.pipeline.fit(X_train, y_train)
            y_pred = self.pipeline.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            print(f"[OK] Mo hinh phan loai - Accuracy: {acc:.2%}")
        else:
            self.pipeline.fit(X, y)
            print(f"[OK] Mo hinh phan loai da train voi {len(X)} mau.")

        # Lưu model
        joblib.dump(self.pipeline, MODEL_PATH)
        self.is_trained = True

    def predict(self, description: str) -> dict:
        """Dự đoán danh mục cho một mô tả giao dịch"""
        if not self.is_trained or self.pipeline is None:
            return {"error": "Model chưa được train"}

        # Chuan hoa input truoc khi predict (bo dau giong nhu luc train)
        desc_normalized = normalize_text(description)

        # Lay xac suat cua tung danh muc
        proba = self.pipeline.predict_proba([desc_normalized])[0]
        classes = self.pipeline.classes_

        # Sắp xếp theo xác suất giảm dần
        proba_dict = dict(sorted(
            zip(classes, proba.tolist()),
            key=lambda x: x[1],
            reverse=True
        ))

        predicted_category = max(proba_dict, key=proba_dict.get)
        confidence = proba_dict[predicted_category]

        return {
            "category":    predicted_category,
            "confidence":  round(confidence, 4),
            "all_probs":   {k: round(v, 4) for k, v in list(proba_dict.items())[:5]},
        }
