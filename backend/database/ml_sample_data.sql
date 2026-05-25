-- ============================================================
-- ML SAMPLE DATA: ~300 giao dịch mẫu cho tháng 2, 3 và 5/2026
-- Mục đích: Train Thuật toán học máy (Naive Bayes + K-Means)
-- Database: expense_management
-- Chạy SAU khi đã chạy schema.sql và seed.sql
-- ============================================================

USE expense_management;

-- ============================================================
-- LẤY BIẾN THAM CHIẾU (user & accounts & categories)
-- ============================================================
SET @user_id    = (SELECT id FROM users WHERE email = 'test@gmail.com' LIMIT 1);

SET @acc_cash   = (SELECT id FROM accounts WHERE user_id = @user_id AND type = 'cash'     LIMIT 1);
SET @acc_bank   = (SELECT id FROM accounts WHERE user_id = @user_id AND type = 'bank'     LIMIT 1);
SET @acc_momo   = (SELECT id FROM accounts WHERE user_id = @user_id AND type = 'e_wallet' LIMIT 1);

-- Danh mục chi tiêu
SET @cat_food       = (SELECT id FROM categories WHERE name = 'Ăn uống'    AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_transport  = (SELECT id FROM categories WHERE name = 'Di chuyển'  AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_shopping   = (SELECT id FROM categories WHERE name = 'Mua sắm'    AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_entertain  = (SELECT id FROM categories WHERE name = 'Giải trí'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_health     = (SELECT id FROM categories WHERE name = 'Sức khỏe'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_education  = (SELECT id FROM categories WHERE name = 'Giáo dục'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_bills      = (SELECT id FROM categories WHERE name = 'Hóa đơn'    AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_housing    = (SELECT id FROM categories WHERE name = 'Nhà ở'      AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_beauty     = (SELECT id FROM categories WHERE name = 'Làm đẹp'    AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_travel     = (SELECT id FROM categories WHERE name = 'Du lịch'    AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_gift_out   = (SELECT id FROM categories WHERE name = 'Quà tặng'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_other_exp  = (SELECT id FROM categories WHERE name = 'Chi khác'   AND type = 'expense' AND user_id IS NULL LIMIT 1);

-- Danh mục thu nhập
SET @cat_salary     = (SELECT id FROM categories WHERE name = 'Lương'      AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_bonus      = (SELECT id FROM categories WHERE name = 'Thưởng'     AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_invest     = (SELECT id FROM categories WHERE name = 'Đầu tư'     AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_freelance  = (SELECT id FROM categories WHERE name = 'Freelance'   AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_gift_in    = (SELECT id FROM categories WHERE name = 'Quà nhận'   AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_other_inc  = (SELECT id FROM categories WHERE name = 'Thu khác'   AND type = 'income'  AND user_id IS NULL LIMIT 1);


-- ============================================================
-- ██████  THÁNG 2/2026  ██████  (100 giao dịch)
-- ============================================================

-- == Thu nhập tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_salary,    'income', 13500000, 'Lương tháng 2/2026',               'Công ty ABC', '2026-02-01'),
(@user_id, @acc_bank, @cat_bonus,     'income',  2000000, 'Thưởng Tết Nguyên Đán',            'Thưởng tháng 2', '2026-02-03'),
(@user_id, @acc_bank, @cat_freelance, 'income',  3500000, 'Dự án thiết kế logo khách hàng',   'Khách Minh Tuấn', '2026-02-10'),
(@user_id, @acc_bank, @cat_invest,    'income',  1200000, 'Cổ tức cổ phiếu VNM',             'Vinamilk Q4', '2026-02-15'),
(@user_id, @acc_bank, @cat_freelance, 'income',  2000000, 'Dự án website cho nhà hàng',       'PHP + MySQL', '2026-02-20'),
(@user_id, @acc_bank, @cat_other_inc, 'income',   500000, 'Bán đồ cũ không dùng',             'Facebook Marketplace', '2026-02-22'),
(@user_id, @acc_bank, @cat_gift_in,   'income',  1000000, 'Lì xì Tết từ gia đình',           'Ba mẹ tặng', '2026-02-07');

-- == Nhà ở & Hóa đơn tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_housing, 'expense', 3500000, 'Tiền thuê nhà tháng 2',             'Thanh toán chủ nhà', '2026-02-01'),
(@user_id, @acc_bank, @cat_bills,   'expense', 1350000, 'Hóa đơn điện tháng 1 (kỳ tháng 2)','EVN', '2026-02-05'),
(@user_id, @acc_bank, @cat_bills,   'expense',  280000, 'Hóa đơn nước tháng 1',             'Cty Cấp nước', '2026-02-05'),
(@user_id, @acc_momo, @cat_bills,   'expense',  249000, 'Internet FPT tháng 2',              '100Mbps gói gia đình', '2026-02-08'),
(@user_id, @acc_momo, @cat_bills,   'expense',   99000, 'Gói điện thoại Viettel tháng 2',   'Data 30GB', '2026-02-08');

-- == Ăn uống tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food, 'expense',  75000, 'Cơm trưa văn phòng',                   'Cơm bình dân', '2026-02-02'),
(@user_id, @acc_cash, @cat_food, 'expense', 110000, 'Phở bò buổi sáng với bạn',             'Phở Thìn', '2026-02-03'),
(@user_id, @acc_momo, @cat_food, 'expense', 185000, 'Grab Food đặt pizza',                  'Pizza 4P\'s', '2026-02-04'),
(@user_id, @acc_cash, @cat_food, 'expense',  65000, 'Bún bò Huế ăn sáng',                  'Quán bà Hằng', '2026-02-06'),
(@user_id, @acc_momo, @cat_food, 'expense',  55000, 'Cà phê Highlands buổi sáng',           'Americano lạnh', '2026-02-07'),
(@user_id, @acc_cash, @cat_food, 'expense', 320000, 'Lẩu hải sản tất niên với gia đình',   'Nhà hàng Biển Đông', '2026-02-08'),
(@user_id, @acc_cash, @cat_food, 'expense',  85000, 'Bánh mì + cà phê sữa buổi sáng',     'Bánh mì Hải Dương', '2026-02-10'),
(@user_id, @acc_momo, @cat_food, 'expense', 145000, 'Shopee Food đặt cơm chiều',           'Cơm gà Hội An', '2026-02-11'),
(@user_id, @acc_cash, @cat_food, 'expense',  90000, 'Cơm trưa bụi gần công ty',           'Cơm tấm sườn', '2026-02-12'),
(@user_id, @acc_cash, @cat_food, 'expense', 450000, 'Tiệc tất niên công ty (đóng góp)',   'KTV Luxury', '2026-02-14'),
(@user_id, @acc_momo, @cat_food, 'expense',  49000, 'Trà sữa Gong Cha',                    'Matcha latte size L', '2026-02-16'),
(@user_id, @acc_cash, @cat_food, 'expense',  95000, 'Cơm văn phòng + nước ngọt',          'Cơm bình dân khu CN', '2026-02-17'),
(@user_id, @acc_momo, @cat_food, 'expense', 230000, 'Gọi đồ ăn Baemin cho cả nhà',       'Baemin khuyến mãi', '2026-02-18'),
(@user_id, @acc_cash, @cat_food, 'expense', 180000, 'Buffet sushi cùng bạn bè',           'Sushi World', '2026-02-19'),
(@user_id, @acc_cash, @cat_food, 'expense',  75000, 'Cơm trưa + trà đá',                  'Cơm bình dân', '2026-02-21'),
(@user_id, @acc_momo, @cat_food, 'expense',  65000, 'Coffee Starbucks đi làm',            'Caramel Macchiato', '2026-02-23'),
(@user_id, @acc_cash, @cat_food, 'expense', 290000, 'Nhậu cuối tuần với đồng nghiệp',    'Bia tươi Hà Nội', '2026-02-24'),
(@user_id, @acc_momo, @cat_food, 'expense', 120000, 'KFC gà rán + khoai tây chiên',      'KFC Combo 2 người', '2026-02-25'),
(@user_id, @acc_cash, @cat_food, 'expense',  80000, 'Bún chả Hà Nội ăn trưa',            'Quán bà Hương', '2026-02-26'),
(@user_id, @acc_cash, @cat_food, 'expense',  72000, 'Cháo sườn + nước cam buổi tối',     'Quán cháo đêm', '2026-02-27');

-- == Di chuyển tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_transport, 'expense', 145000, 'Grab bike cả tuần đầu tháng',      'Tháng 2 rét nhiều', '2026-02-07'),
(@user_id, @acc_cash, @cat_transport, 'expense', 320000, 'Đổ xăng xe máy',                   'Shell V-Power', '2026-02-10'),
(@user_id, @acc_momo, @cat_transport, 'expense', 180000, 'Grab car đi sân bay đón ba',       'Sân bay TSN', '2026-02-11'),
(@user_id, @acc_cash, @cat_transport, 'expense',  20000, 'Giữ xe cả tuần tại công ty',      'Bãi xe tầng hầm', '2026-02-14'),
(@user_id, @acc_momo, @cat_transport, 'expense', 120000, 'Grab bike về nhà muộn',            'Làm thêm giờ', '2026-02-17'),
(@user_id, @acc_cash, @cat_transport, 'expense', 280000, 'Vé xe khách Sài Gòn – Vũng Tàu',  'Phương Trang', '2026-02-20'),
(@user_id, @acc_cash, @cat_transport, 'expense',  15000, 'Giữ xe siêu thị',                 'CoopMart', '2026-02-22'),
(@user_id, @acc_momo, @cat_transport, 'expense',  90000, 'Be taxi đi tiệc',                 'Be App', '2026-02-24');

-- == Mua sắm tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_shopping, 'expense',  650000, 'Mua áo dài Tết trên Shopee',       'Sale 50%', '2026-02-02'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  420000, 'Mua giày thể thao Biti\'s',        'Biti\'s Hunter X', '2026-02-08'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  185000, 'Siêu thị VinMart mua đồ Tết',     'Bánh kẹo, bia', '2026-02-09'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  320000, 'Mua mỹ phẩm The Face Shop',       'Kem dưỡng ẩm', '2026-02-13'),
(@user_id, @acc_momo, @cat_shopping, 'expense',   98000, 'Lazada mua dây sạc iPhone',       'Anker MFi', '2026-02-16'),
(@user_id, @acc_bank, @cat_shopping, 'expense', 1200000, 'Mua tai nghe Sony WH-1000XM5',    'Chống ồn', '2026-02-18'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  145000, 'CoopMart mua đồ gia dụng',        'Nước rửa chén, bột giặt', '2026-02-21'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  390000, 'TikTok Shop quần áo thể thao',    'Adidas rep', '2026-02-25');

-- == Giải trí tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_entertain, 'expense', 199000, 'Netflix gia hạn tháng 2',         'Gói HD', '2026-02-01'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  59000, 'Spotify Premium tháng 2',         'Auto-renew', '2026-02-01'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 175000, 'Xem phim CGV với bạn gái',        'Captain America 4', '2026-02-09'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 350000, 'Karaoke Lucky tối thứ 6',         'Phòng VIP 3 tiếng', '2026-02-14'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 120000, 'Game Steam mua DLC',              'Elden Ring DLC', '2026-02-16'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 280000, 'Bowling AMG cuối tuần',           '3 ván + giày', '2026-02-21'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  89000, 'YouTube Premium tháng 2',         'No ads', '2026-02-01');

-- == Sức khỏe tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_health, 'expense', 350000, 'Đăng ký gym California Fitness',    'Gói tháng', '2026-02-01'),
(@user_id, @acc_cash, @cat_health, 'expense',  85000, 'Mua thuốc cảm cúm mùa đông',       'Nhà thuốc Long Châu', '2026-02-06'),
(@user_id, @acc_bank, @cat_health, 'expense', 450000, 'Khám tổng quát bệnh viện FV',      'Định kỳ 6 tháng', '2026-02-15'),
(@user_id, @acc_cash, @cat_health, 'expense',  45000, 'Thuốc bổ vitamin C tháng',         'Nature\'s Way', '2026-02-20'),
(@user_id, @acc_bank, @cat_health, 'expense', 250000, 'Khám nha sĩ lấy cao răng',         'Nha khoa Việt Nhật', '2026-02-24');

-- == Giáo dục tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_education, 'expense', 1200000, 'Học phí khóa IELTS tháng 2',   'Trung tâm IELTS Fighter', '2026-02-02'),
(@user_id, @acc_momo, @cat_education, 'expense',  299000, 'Khóa học Python trên Udemy',   'Complete Python 3', '2026-02-10'),
(@user_id, @acc_cash, @cat_education, 'expense',   95000, 'Mua sách Clean Code',          'Book Street Q1', '2026-02-15'),
(@user_id, @acc_bank, @cat_education, 'expense',  180000, 'Mua sách Tư Duy Nhanh Chậm',  'Sách kinh tế', '2026-02-20');

-- == Làm đẹp tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_beauty, 'expense', 120000, 'Cắt tóc Barber Shop Gentlemen',    'Fade + Wash', '2026-02-07'),
(@user_id, @acc_cash, @cat_beauty, 'expense',  85000, 'Wax lông mặt + xịt dưỡng da',     'Tiệm làm đẹp My Lan', '2026-02-19');

-- == Quà tặng tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_gift_out, 'expense', 500000, 'Lì xì cho các cháu ngày Tết',     '5 cháu x 100k', '2026-02-05'),
(@user_id, @acc_bank, @cat_gift_out, 'expense', 350000, 'Quà sinh nhật bạn thân',          'Hoa + bánh kem', '2026-02-17'),
(@user_id, @acc_bank, @cat_gift_out, 'expense', 280000, 'Quà Valentine cho bạn gái',       '14/02', '2026-02-14');

-- == Du lịch & Chi khác tháng 2 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_travel,    'expense', 850000, 'Vé xe + khách sạn Vũng Tàu 2N1Đ','Trip cuối tuần', '2026-02-20'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  95000, 'Photocopy + in tài liệu',         'Cửa hàng Copy', '2026-02-12'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  50000, 'Phí ATM rút tiền',               'Phí ngoại mạng', '2026-02-18');


-- ============================================================
-- ██████  THÁNG 3/2026  ██████  (101 giao dịch)
-- ============================================================

-- == Thu nhập tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_salary,    'income', 13500000, 'Lương tháng 3/2026',              'Công ty ABC', '2026-03-01'),
(@user_id, @acc_bank, @cat_freelance, 'income',  4500000, 'Dự án app mobile cho startup',   'React Native', '2026-03-08'),
(@user_id, @acc_bank, @cat_invest,    'income',   850000, 'Lãi tiết kiệm MB Bank tháng 3',  'Lãi suất 6.5%/năm', '2026-03-15'),
(@user_id, @acc_bank, @cat_bonus,     'income',  1000000, 'Thưởng KPI Q1/2026',             'Đạt 105% mục tiêu', '2026-03-28'),
(@user_id, @acc_bank, @cat_other_inc, 'income',   300000, 'Hoàn tiền cashback Momo',        'Tích lũy Q4/2025', '2026-03-10');

-- == Nhà ở & Hóa đơn tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_housing, 'expense', 3500000, 'Tiền thuê nhà tháng 3',            'Thanh toán chủ nhà', '2026-03-01'),
(@user_id, @acc_bank, @cat_bills,   'expense', 1420000, 'Hóa đơn điện tháng 2 (EVN)',       'Kỳ tháng 3', '2026-03-05'),
(@user_id, @acc_bank, @cat_bills,   'expense',  265000, 'Hóa đơn nước tháng 2',            'Cty cấp nước TPHCM', '2026-03-05'),
(@user_id, @acc_momo, @cat_bills,   'expense',  249000, 'Internet FPT tháng 3',             'Tự động gia hạn', '2026-03-08'),
(@user_id, @acc_momo, @cat_bills,   'expense',   99000, 'Gói điện thoại Viettel tháng 3',  'Data 30GB', '2026-03-08'),
(@user_id, @acc_bank, @cat_bills,   'expense',  180000, 'Vệ sinh điều hòa',                '2 cụm indoor', '2026-03-15');

-- == Ăn uống tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food, 'expense',  80000, 'Cơm trưa bụi + nước mía',             'Gần công ty', '2026-03-02'),
(@user_id, @acc_momo, @cat_food, 'expense',  55000, 'Cà phê sáng Phúc Long',               'Trà sữa Thái đỏ', '2026-03-03'),
(@user_id, @acc_momo, @cat_food, 'expense', 210000, 'Grab Food đặt lẩu thai',              'Lẩu Thái Mama', '2026-03-04'),
(@user_id, @acc_cash, @cat_food, 'expense',  68000, 'Hủ tiếu Nam Vang ăn sáng',           'Quán quen', '2026-03-05'),
(@user_id, @acc_cash, @cat_food, 'expense',  95000, 'Cơm trưa + canh chua',               'Cơm nhà bếp', '2026-03-06'),
(@user_id, @acc_cash, @cat_food, 'expense', 420000, 'Đi ăn tôm hùm mừng tăng lương',     'Nhà hàng Hoàng Gia', '2026-03-07'),
(@user_id, @acc_cash, @cat_food, 'expense',  82000, 'Cơm trưa + trà đá + tráng miệng',   'Cơm bình dân', '2026-03-09'),
(@user_id, @acc_momo, @cat_food, 'expense', 165000, 'ShopeeFood gọi cơm chiều',           'Cơm gà Hội An', '2026-03-10'),
(@user_id, @acc_cash, @cat_food, 'expense', 135000, 'Ăn tối phở Thìn với đồng nghiệp',   'Phở bò tái nạm', '2026-03-11'),
(@user_id, @acc_momo, @cat_food, 'expense',  49000, 'Trà sữa KOI Thé chiều',              'Milk tea đường 70%', '2026-03-12'),
(@user_id, @acc_cash, @cat_food, 'expense',  78000, 'Cơm chiên dương châu + canh',        'Cơm chiên tiệm', '2026-03-13'),
(@user_id, @acc_cash, @cat_food, 'expense', 380000, 'Tiệc sinh nhật đồng nghiệp (góp)',   'Nhà hàng + bánh kem', '2026-03-14'),
(@user_id, @acc_momo, @cat_food, 'expense', 185000, 'Baemin đặt burger BonChon',          'Combo set cho 2', '2026-03-16'),
(@user_id, @acc_cash, @cat_food, 'expense',  72000, 'Bánh cuốn + cà phê sáng',           'Bánh cuốn Thanh Trì', '2026-03-17'),
(@user_id, @acc_momo, @cat_food, 'expense',  65000, 'Coffee Highlands đọc sách',          'Cold brew + bánh', '2026-03-18'),
(@user_id, @acc_cash, @cat_food, 'expense',  98000, 'Cơm trưa + nước ngọt lon',          'Cơm bình dân', '2026-03-19'),
(@user_id, @acc_cash, @cat_food, 'expense', 560000, 'Tiệc tất toán dự án với team',      'Lẩu nướng BBQ', '2026-03-20'),
(@user_id, @acc_cash, @cat_food, 'expense',  88000, 'Cơm trưa + sinh tố trái cây',       'Cơm bình dân', '2026-03-23'),
(@user_id, @acc_momo, @cat_food, 'expense', 145000, 'Grab Food pizza Domino\'s',         'Personal pizza', '2026-03-24'),
(@user_id, @acc_cash, @cat_food, 'expense', 255000, 'Ăn buffet KBBQ với bạn bè',         'King BBQ Quận 1', '2026-03-25'),
(@user_id, @acc_cash, @cat_food, 'expense',  85000, 'Cơm tấm sườn nướng',               'Cơm tấm Kiều Giang', '2026-03-26'),
(@user_id, @acc_momo, @cat_food, 'expense',  48000, 'Cà phê sáng + bánh mì',            'Cà phê vỉa hè', '2026-03-27'),
(@user_id, @acc_cash, @cat_food, 'expense', 310000, 'Ăn hải sản cuối tháng',            'Hải sản Cần Giờ', '2026-03-28'),
(@user_id, @acc_cash, @cat_food, 'expense',  76000, 'Mì Ý sốt bò bằm + nước ép',       'Pasta tiệm Ý', '2026-03-30'),
(@user_id, @acc_cash, @cat_food, 'expense',  92000, 'Cơm trưa + chè thái',              'Cơm bình dân', '2026-03-31');

-- == Di chuyển tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_transport, 'expense', 160000, 'Grab bike đi làm cả tuần 1',      'Tuần 1/3', '2026-03-07'),
(@user_id, @acc_cash, @cat_transport, 'expense', 350000, 'Đổ xăng xe máy',                  'Esso 95', '2026-03-08'),
(@user_id, @acc_momo, @cat_transport, 'expense', 140000, 'Grab bike đi làm cả tuần 2',      'Tuần 2/3', '2026-03-14'),
(@user_id, @acc_momo, @cat_transport, 'expense', 210000, 'Grab car đến hội thảo IT',        'Saigon IT Conf', '2026-03-15'),
(@user_id, @acc_cash, @cat_transport, 'expense',  25000, 'Vé xe buýt đi trung tâm',        'Tuyến 08', '2026-03-17'),
(@user_id, @acc_momo, @cat_transport, 'expense', 155000, 'Grab bike đi làm cả tuần 3',     'Tuần 3/3', '2026-03-21'),
(@user_id, @acc_cash, @cat_transport, 'expense', 320000, 'Sửa xe thay má phanh + dầu',     'Tiệm xe Đức Tài', '2026-03-22'),
(@user_id, @acc_momo, @cat_transport, 'expense', 145000, 'Grab bike đi làm cả tuần 4',     'Tuần 4/3', '2026-03-28'),
(@user_id, @acc_bank, @cat_transport, 'expense', 1250000,'Vé máy bay SGN-HAN khứ hồi',     'VietJet', '2026-03-25');

-- == Mua sắm tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_shopping, 'expense',  899000, 'Mua bàn phím cơ Keychron K2',    'Shopee Flash Sale', '2026-03-03'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  220000, 'VinMart mua thực phẩm tươi',     'Rau củ + thịt', '2026-03-07'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  345000, 'Lazada mua ốp điện thoại',       'Spigen + dán màn', '2026-03-10'),
(@user_id, @acc_momo, @cat_shopping, 'expense',  168000, 'TikTok Shop quần tập gym',       'Jogger pants', '2026-03-13'),
(@user_id, @acc_bank, @cat_shopping, 'expense', 2800000, 'Mua robot hút bụi Xiaomi',       'Roborock S5 Max', '2026-03-16'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  175000, 'Big C mua đồ dùng nhà bếp',     'Chén bát + muỗng', '2026-03-19'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  590000, 'Mua quần jean Levi\'s',          '501 Original Fit', '2026-03-22'),
(@user_id, @acc_momo, @cat_shopping, 'expense',   95000, 'Shopee mua sạc dự phòng Baseus', '10000mAh', '2026-03-26'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  420000, 'Điện máy xanh mua nồi cơm',     'Cuckoo 1.8L', '2026-03-29');

-- == Giải trí tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_entertain, 'expense', 199000, 'Netflix tháng 3',                 'Gia hạn tự động', '2026-03-01'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  59000, 'Spotify Premium tháng 3',         'Gia hạn tự động', '2026-03-01'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 350000, 'Xem concert Sơn Tùng MTP',        'Vé zone B', '2026-03-08'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 280000, 'Billiards với nhóm bạn',          'Club 6 Ball', '2026-03-13'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 155000, 'CGV xem Avengers Secret Wars',   'Ghế VIP + bắp+nước', '2026-03-15'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  89000, 'YouTube Premium tháng 3',         'No ads', '2026-03-01'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 450000, 'Tour tham quan Dinh Độc Lập',    'Nhóm 4 người', '2026-03-22'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 200000, 'Escape room Breakout',            'Phòng The Museum', '2026-03-28');

-- == Sức khỏe tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_health, 'expense', 350000, 'Gym tháng 3 California Fitness',    'Gia hạn thẻ tháng', '2026-03-01'),
(@user_id, @acc_cash, @cat_health, 'expense', 125000, 'Thuốc dị ứng mùa xuân',            'Nhà thuốc Pharmacity', '2026-03-05'),
(@user_id, @acc_bank, @cat_health, 'expense', 680000, 'Khám mắt + kính áp tròng mới',     'Trung tâm mắt Sài Gòn', '2026-03-12'),
(@user_id, @acc_cash, @cat_health, 'expense',  55000, 'Mua thuốc bổ Vitamin B tổng hợp',  'Nhà thuốc Long Châu', '2026-03-18'),
(@user_id, @acc_bank, @cat_health, 'expense', 290000, 'Yoga class 4 buổi tuần',           'Yoga Plus Studio', '2026-03-20');

-- == Giáo dục tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_education, 'expense', 1200000, 'Học phí khóa IELTS tháng 3',    'Trung tâm IELTS Fighter', '2026-03-02'),
(@user_id, @acc_bank, @cat_education, 'expense',  499000, 'Khóa học AWS Cloud Practitioner','Udemy + voucher', '2026-03-05'),
(@user_id, @acc_cash, @cat_education, 'expense',  185000, 'Mua sách Thiết kế trong cuộc sống','Book Street', '2026-03-12'),
(@user_id, @acc_bank, @cat_education, 'expense',  350000, 'Khóa Excel nâng cao online',    'Gitiho', '2026-03-20');

-- == Làm đẹp tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_beauty, 'expense', 150000, 'Cắt tóc + gội đầu massage',         'Barber King', '2026-03-06'),
(@user_id, @acc_bank, @cat_beauty, 'expense', 320000, 'Mua kem chống nắng + toner',        'Innisfree Olive Young', '2026-03-14'),
(@user_id, @acc_cash, @cat_beauty, 'expense',  80000, 'Cạo râu + dưỡng da mặt',           'The Barber Shop', '2026-03-25');

-- == Du lịch & Quà tặng tháng 3 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_travel,    'expense', 2800000, 'Chuyến Hà Nội 3N2Đ',           'Vé máy bay + khách sạn', '2026-03-27'),
(@user_id, @acc_cash, @cat_gift_out,  'expense',  380000, 'Quà 8/3 cho mẹ + chị gái',     'Hoa + quà', '2026-03-08'),
(@user_id, @acc_bank, @cat_other_exp, 'expense',   75000, 'Phí chuyển tiền ngân hàng',     'Phí SWIFT nội địa', '2026-03-10');


-- ============================================================
-- ██████  THÁNG 5/2026  ██████  (101 giao dịch)
-- ============================================================

-- == Thu nhập tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_salary,    'income', 14000000, 'Lương tháng 5/2026',             'Tăng lương từ Q2', '2026-05-01'),
(@user_id, @acc_bank, @cat_freelance, 'income',  5500000, 'Dự án SEO & Content cho spa',   'Khách Wellness Zone', '2026-05-05'),
(@user_id, @acc_bank, @cat_invest,    'income',  1500000, 'Lợi nhuận từ chứng khoán',      'Bán VHM tháng 5', '2026-05-08'),
(@user_id, @acc_bank, @cat_bonus,     'income',  3000000, 'Thưởng dự án Q1 xuất sắc',      'Top performer', '2026-05-10'),
(@user_id, @acc_bank, @cat_freelance, 'income',  2800000, 'Dự án React Native app cho gym','Tháng 2 giao hàng', '2026-05-15'),
(@user_id, @acc_bank, @cat_other_inc, 'income',   750000, 'Bán laptop cũ Thinkpad T480',   'Facebook Marketplace', '2026-05-18'),
(@user_id, @acc_bank, @cat_invest,    'income',   480000, 'Cổ tức VNM tháng 5',            'Vinamilk Q1 2026', '2026-05-20');

-- == Nhà ở & Hóa đơn tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_housing, 'expense', 3500000, 'Tiền thuê nhà tháng 5',           'Thanh toán chủ nhà', '2026-05-01'),
(@user_id, @acc_bank, @cat_bills,   'expense', 1580000, 'Hóa đơn điện tháng 4 (cao điểm)','EVN - Tháng nắng nóng', '2026-05-05'),
(@user_id, @acc_bank, @cat_bills,   'expense',  295000, 'Hóa đơn nước tháng 4',           'Cty cấp nước TPHCM', '2026-05-05'),
(@user_id, @acc_momo, @cat_bills,   'expense',  249000, 'Internet FPT tháng 5',            'Tự động gia hạn', '2026-05-08'),
(@user_id, @acc_momo, @cat_bills,   'expense',   99000, 'Gói điện thoại Viettel tháng 5', 'Data 30GB', '2026-05-08'),
(@user_id, @acc_bank, @cat_bills,   'expense',  350000, 'Nạp điện trả trước tháng hè',    'EVN prepaid', '2026-05-12'),
(@user_id, @acc_bank, @cat_bills,   'expense',  450000, 'Sửa khóa cửa + thay ổ điện',    'Thợ điện nước', '2026-05-17');

-- == Ăn uống tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food, 'expense',  88000, 'Cơm trưa văn phòng + nước dừa',      'Cơm bình dân mùa hè', '2026-05-02'),
(@user_id, @acc_momo, @cat_food, 'expense',  60000, 'Cà phê đá Highlands buổi sáng',      'Americano đá size M', '2026-05-03'),
(@user_id, @acc_momo, @cat_food, 'expense', 225000, 'Grab Food đặt cơm chiều cả tuần',   'ShopeeFood voucher', '2026-05-04'),
(@user_id, @acc_cash, @cat_food, 'expense',  78000, 'Bánh mì thịt + sữa đậu nành',       'Bánh mì Huỳnh Hoa', '2026-05-05'),
(@user_id, @acc_cash, @cat_food, 'expense',  95000, 'Cơm trưa + chè thái tráng miệng',   'Cơm bình dân', '2026-05-06'),
(@user_id, @acc_cash, @cat_food, 'expense', 485000, 'BBQ nướng mừng ngày Lao Động',      'Nhóm 5 người', '2026-05-01'),
(@user_id, @acc_momo, @cat_food, 'expense',  52000, 'Trà sữa Tiger Sugar',               'Brown sugar milk tea', '2026-05-07'),
(@user_id, @acc_cash, @cat_food, 'expense',  85000, 'Cơm trưa gần công ty',              'Cơm bình dân', '2026-05-08'),
(@user_id, @acc_momo, @cat_food, 'expense', 195000, 'Baemin đặt cơm chiều',             'Cơm gà Hồng Kông', '2026-05-09'),
(@user_id, @acc_cash, @cat_food, 'expense', 290000, 'Ăn tối seafood cuối tuần',         'Cần Giờ hải sản', '2026-05-10'),
(@user_id, @acc_cash, @cat_food, 'expense',  82000, 'Bún thịt nướng + chả giò',         'Quán bà Sáu', '2026-05-11'),
(@user_id, @acc_momo, @cat_food, 'expense',  65000, 'Coffee Starbucks + cheesecake',     'Caffe latte + bánh', '2026-05-12'),
(@user_id, @acc_cash, @cat_food, 'expense',  90000, 'Cơm trưa + nước mía',             'Cơm bình dân hẻm', '2026-05-13'),
(@user_id, @acc_cash, @cat_food, 'expense', 350000, 'Tiệc nhỏ sinh nhật cháu',         'Pizza + gà rán KFC', '2026-05-14'),
(@user_id, @acc_momo, @cat_food, 'expense', 175000, 'Grab Food đặt ramen tối',         'Ramen Ichiro', '2026-05-15'),
(@user_id, @acc_cash, @cat_food, 'expense',  76000, 'Bánh cuốn + trứng chiên sáng',    'Tiệm bánh cuốn quen', '2026-05-16'),
(@user_id, @acc_momo, @cat_food, 'expense',  58000, 'Nước ép trái cây + bánh',         'Ép lấy ngay', '2026-05-17'),
(@user_id, @acc_cash, @cat_food, 'expense',  98000, 'Cơm trưa + canh cải',            'Cơm bình dân', '2026-05-18'),
(@user_id, @acc_cash, @cat_food, 'expense', 410000, 'Ăn nhà hàng ngày nghỉ với gia đình','Chả cá Thăng Long', '2026-05-19'),
(@user_id, @acc_momo, @cat_food, 'expense', 145000, 'ShopeeFood cơm chiều',            'Cơm Hải Phố', '2026-05-20'),
(@user_id, @acc_cash, @cat_food, 'expense',  86000, 'Cơm trưa + sinh tố xoài',        'Cơm bình dân mùa hè', '2026-05-21'),
(@user_id, @acc_cash, @cat_food, 'expense',  73000, 'Bánh ướt + cà phê đen đá',       'Sáng vỉa hè', '2026-05-22');

-- == Di chuyển tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_transport, 'expense', 175000, 'Grab bike đi làm cả tuần 1',     'Tuần 1/5', '2026-05-07'),
(@user_id, @acc_cash, @cat_transport, 'expense', 370000, 'Đổ xăng RON95 xe máy',           'Petrolimex', '2026-05-08'),
(@user_id, @acc_momo, @cat_transport, 'expense', 165000, 'Grab bike đi làm cả tuần 2',     'Tuần 2/5', '2026-05-14'),
(@user_id, @acc_momo, @cat_transport, 'expense', 255000, 'Grab car đi họp client Q1',      'Quận 1', '2026-05-11'),
(@user_id, @acc_cash, @cat_transport, 'expense',  30000, 'Vé xe buýt + xe buýt nhanh',    'BRT tuyến Võ Văn Kiệt', '2026-05-13'),
(@user_id, @acc_momo, @cat_transport, 'expense', 170000, 'Grab bike đi làm cả tuần 3',    'Tuần 3/5', '2026-05-21'),
(@user_id, @acc_cash, @cat_transport, 'expense', 450000, 'Đổ xăng + rửa xe máy',         'Shell + tiệm rửa', '2026-05-20'),
(@user_id, @acc_bank, @cat_transport, 'expense', 980000, 'Vé xe khách Limousine SGN-ĐL',  'Phương Trang VIP', '2026-05-09');

-- == Mua sắm tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_shopping, 'expense', 1290000, 'Mua đồng hồ Casio G-Shock',     'G-Shock DW-6900', '2026-05-03'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  245000, 'VinMart mua thực phẩm hàng tuần','Rau củ + thịt cá', '2026-05-04'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  450000, 'Lazada mua đèn bàn LED học',    'Xiaomi Mi LED', '2026-05-06'),
(@user_id, @acc_momo, @cat_shopping, 'expense',  195000, 'TikTok Shop áo sơ mi nam',      'Hàng Thái', '2026-05-09'),
(@user_id, @acc_bank, @cat_shopping, 'expense', 5500000, 'Mua iPad mini 7 (trả góp)',     'iBox tháng đầu', '2026-05-11'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  182000, 'Big C mua đồ vệ sinh nhà',     'Lau sàn + nước rửa', '2026-05-13'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  680000, 'Mua giày chạy bộ Nike',        'Nike Air Zoom Pegasus', '2026-05-15'),
(@user_id, @acc_momo, @cat_shopping, 'expense',  145000, 'Shopee mua đế tản nhiệt laptop','RGB cooling pad', '2026-05-17'),
(@user_id, @acc_bank, @cat_shopping, 'expense',  320000, 'Mua quần short + áo thun',     'Uniqlo sale tháng 5', '2026-05-19'),
(@user_id, @acc_cash, @cat_shopping, 'expense',  265000, 'CoopMart thực phẩm cuối tuần', 'Thực phẩm đông lạnh', '2026-05-21');

-- == Giải trí tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_entertain, 'expense', 199000, 'Netflix tháng 5',                'Gia hạn tự động', '2026-05-01'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  59000, 'Spotify Premium tháng 5',        'Gia hạn tự động', '2026-05-01'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 480000, 'Vé concert Đen Vâu',            'Zone A đứng', '2026-05-03'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 185000, 'CGV Avengers Secret Wars 4DX',  'Ghế 4DX + bắp', '2026-05-10'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 320000, 'Karaoke tối thứ 6 với team',   'Phòng 4 người', '2026-05-15'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 250000, 'Nintendo Switch game mua DLC',  'Zelda Tears 2', '2026-05-17'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  89000, 'YouTube Premium tháng 5',       'No ads', '2026-05-01'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 380000, 'Miniature golf + bowling',      'Air Bowling Q7', '2026-05-18'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 150000, 'Mua sách truyện tranh Manga',   'Naruto Full Boxset', '2026-05-20');

-- == Sức khỏe tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_health, 'expense', 350000, 'Gym tháng 5 California Fitness',   'Gia hạn thẻ', '2026-05-01'),
(@user_id, @acc_cash, @cat_health, 'expense',  95000, 'Kem chống nắng + xịt khoáng',     'Nhà thuốc Pharmacity', '2026-05-04'),
(@user_id, @acc_bank, @cat_health, 'expense', 850000, 'Khám da liễu tư nhân',            'BS Bùi Thị Lan', '2026-05-07'),
(@user_id, @acc_cash, @cat_health, 'expense',  65000, 'Thuốc đau đầu + B1',             'Nhà thuốc Long Châu', '2026-05-12'),
(@user_id, @acc_bank, @cat_health, 'expense', 480000, 'Yoga 8 buổi + Pilates 4 buổi',   'Yoga House tháng 5', '2026-05-15'),
(@user_id, @acc_bank, @cat_health, 'expense', 650000, 'Bảo hiểm sức khỏe tự nguyện',    'Bảo Việt tháng 5', '2026-05-01'),
(@user_id, @acc_cash, @cat_health, 'expense', 120000, 'Khẩu trang y tế + gel rửa tay',  'CoopMart', '2026-05-19');

-- == Giáo dục tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_education, 'expense', 1200000, 'Học phí IELTS tháng 5 (cuối kỳ)', 'IELTS Fighter', '2026-05-02'),
(@user_id, @acc_bank, @cat_education, 'expense',  799000, 'Khóa học Machine Learning Coursera','Andrew Ng', '2026-05-05'),
(@user_id, @acc_cash, @cat_education, 'expense',  225000, 'Mua 3 quyển sách lập trình',    'Python + SQL + Git', '2026-05-10'),
(@user_id, @acc_bank, @cat_education, 'expense',  450000, 'Khóa Power BI Data Analytics',  'Udemy sale 90%', '2026-05-16'),
(@user_id, @acc_bank, @cat_education, 'expense',  280000, 'Tài liệu ôn thi chứng chỉ AWS', 'Exam readiness', '2026-05-20');

-- == Làm đẹp tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_beauty, 'expense', 150000, 'Cắt tóc + duỗi tóc nhẹ',           'Barber King Q10', '2026-05-03'),
(@user_id, @acc_bank, @cat_beauty, 'expense', 450000, 'Mua serum dưỡng da ban đêm',        'The Ordinary set', '2026-05-10'),
(@user_id, @acc_cash, @cat_beauty, 'expense',  95000, 'Cạo râu + dưỡng ẩm mặt',          'The Barber Shop', '2026-05-17');

-- == Du lịch tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_travel, 'expense', 4500000, 'Du lịch Đà Lạt 3N2Đ (30/4-2/5)', 'Khách sạn + vé xe', '2026-05-02'),
(@user_id, @acc_cash, @cat_travel, 'expense',  850000, 'Ăn uống + vé tham quan Đà Lạt',  'Vườn hoa + cáp treo', '2026-05-02'),
(@user_id, @acc_bank, @cat_travel, 'expense',  320000, 'Đặt homestay Mũi Né cuối tuần',  'Booking.com', '2026-05-09');

-- == Quà tặng & Chi khác tháng 5 ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank, @cat_gift_out,  'expense', 450000, 'Quà sinh nhật bạn thân (tháng 5)','Túi xách + thiệp', '2026-05-06'),
(@user_id, @acc_cash, @cat_gift_out,  'expense', 200000, 'Hoa tặng mẹ ngày 5/5',          'Hoa tươi shop online', '2026-05-05'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  85000, 'Phí photocopy + đóng sách',     'Tiệm Copy Q.Bình Thạnh', '2026-05-13'),
(@user_id, @acc_bank, @cat_other_exp, 'expense', 120000, 'Phí dịch vụ thẻ ngân hàng',    'MB Bank annual fee', '2026-05-01'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  55000, 'Phí ATM rút tiền ngoại mạng',  'ATM Vietcombank', '2026-05-14');



-- ============================================================
-- ██████  BỔ SUNG THÊM ĐỂ ĐẠT ~300 GIAO DỊCH  ██████
-- (Thêm các giao dịch đa dạng hơn cho tháng 2, 3, 5)
-- ============================================================

-- == Bổ sung tháng 2 – Ăn uống + Di chuyển thêm ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food,      'expense',  68000, 'Xôi gà sáng + trà đá',           'Xôi Yến Ngọc', '2026-02-04'),
(@user_id, @acc_momo, @cat_food,      'expense',  95000, 'McDonalds Big Mac set',           'McD phần 1', '2026-02-13'),
(@user_id, @acc_cash, @cat_food,      'expense', 145000, 'Bít tết bò Úc ăn tối',           'Beefsteak 39', '2026-02-15'),
(@user_id, @acc_cash, @cat_food,      'expense',  55000, 'Chè ba màu + nước dừa',          'Quán chè Đồng Khánh', '2026-02-16'),
(@user_id, @acc_momo, @cat_food,      'expense', 175000, 'Grab Food gọi cơm chiều',        'Cơm tấm Phú Nhuận', '2026-02-22'),
(@user_id, @acc_cash, @cat_transport, 'expense',  55000, 'Xe ôm truyền thống đi chợ',      'Xe ôm Hoàng', '2026-02-09'),
(@user_id, @acc_momo, @cat_transport, 'expense', 135000, 'Grab car tan làm mưa lớn',       'Mưa ngập đường', '2026-02-26'),
(@user_id, @acc_bank, @cat_shopping,  'expense', 490000, 'Mua nước hoa Versace Eros',      'Duty free online', '2026-02-28'),
(@user_id, @acc_cash, @cat_entertain, 'expense', 180000, 'Xem xiếc nghệ thuật',            'Liên đoàn xiếc VN', '2026-02-22'),
(@user_id, @acc_bank, @cat_health,    'expense', 180000, 'Mua bình nước lọc Kangaroo',     'Lọc nước văn phòng', '2026-02-28'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  35000, 'Mua phong bì + tem thư',         'Bưu điện', '2026-02-14');

-- == Bổ sung tháng 3 – Đa dạng danh mục ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food,      'expense',  72000, 'Cháo vịt + quẩy ăn sáng',        'Quán cháo Hà Nội', '2026-03-03'),
(@user_id, @acc_momo, @cat_food,      'expense',  89000, 'Bánh mì xíu mại + cà phê đen',   'Bánh mì Hoàng', '2026-03-18'),
(@user_id, @acc_cash, @cat_food,      'expense', 195000, 'Lẩu cua đồng tối thứ 7',         'Lẩu đồng quê', '2026-03-21'),
(@user_id, @acc_cash, @cat_food,      'expense',  58000, 'Sinh tố bơ + bánh tráng trộn',   'Quán sinh tố', '2026-03-26'),
(@user_id, @acc_momo, @cat_transport, 'expense', 195000, 'Grab bike + Grab car 1 tuần',    'Combo tuần cuối', '2026-03-31'),
(@user_id, @acc_bank, @cat_shopping,  'expense', 1450000,'Mua áo khoác dù Uniqlo',         'Ultra Light Down', '2026-03-04'),
(@user_id, @acc_cash, @cat_shopping,  'expense',  138000,'Mua đồ dùng văn phòng phẩm',     'Bút, sổ, kẹp', '2026-03-17'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  129000,'Apple Music tháng 3',             'Gói học sinh', '2026-03-01'),
(@user_id, @acc_bank, @cat_health,    'expense',  420000,'Mua gói yoga online Knowme',     'App yoga 1 tháng', '2026-03-10'),
(@user_id, @acc_cash, @cat_beauty,    'expense',   65000,'Tẩy tế bào chết mặt',            'Tiệm spa nhỏ', '2026-03-20'),
(@user_id, @acc_bank, @cat_gift_out,  'expense',  220000,'Gửi quà qua bưu điện cho bạn',  'Quà sinh nhật từ xa', '2026-03-18'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',   75000,'In ảnh kỷ niệm chuyến Hà Nội',  'Tiệm in ảnh Q3', '2026-03-31');

-- == Bổ sung tháng 5 – Thêm đa dạng ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food,      'expense',  62000, 'Bánh xèo + rau sống ăn trưa',    'Bánh xèo Mười Xiềm', '2026-05-04'),
(@user_id, @acc_momo, @cat_food,      'expense', 115000, 'Burger King combo cheeseburger', 'Combo set 1', '2026-05-07'),
(@user_id, @acc_cash, @cat_food,      'expense', 240000, 'Ăn lẩu thái chua cay cuối tuần', 'Lẩu Thái Orchid', '2026-05-10'),
(@user_id, @acc_momo, @cat_food,      'expense',  78000, 'Nước ép + bánh tiêu ăn sáng',   'Quán ăn sáng', '2026-05-16'),
(@user_id, @acc_cash, @cat_food,      'expense', 185000, 'Cơm niêu + canh cua ăn tối',    'Cơm Niêu Sài Gòn', '2026-05-19'),
(@user_id, @acc_momo, @cat_transport, 'expense', 285000, 'Grab bike + taxi cả tuần 4',    'Tuần cuối tháng 5', '2026-05-22'),
(@user_id, @acc_bank, @cat_shopping,  'expense', 890000, 'Mua loa Bluetooth JBL Charge 5','JBL official store', '2026-05-08'),
(@user_id, @acc_cash, @cat_shopping,  'expense', 165000, 'Mua đồ pha cà phê (phin + ly)', 'Hội quán cà phê', '2026-05-12'),
(@user_id, @acc_momo, @cat_entertain, 'expense', 129000, 'Apple Music tháng 5',            'Gói cá nhân', '2026-05-01'),
(@user_id, @acc_bank, @cat_entertain, 'expense', 590000, 'Vé xem kịch Idecaf',            'Suất diễn tối thứ 7', '2026-05-22'),
(@user_id, @acc_cash, @cat_health,    'expense', 180000, 'Mua collagen + vitamin E',       'Nhà thuốc Trường Sinh', '2026-05-06'),
(@user_id, @acc_bank, @cat_health,    'expense', 320000, 'Xét nghiệm máu định kỳ',        'Bệnh viện quận', '2026-05-14'),
(@user_id, @acc_cash, @cat_beauty,    'expense', 220000, 'Chăm sóc da mặt + mặt nạ',     'Spa Bé Tư', '2026-05-08'),
(@user_id, @acc_bank, @cat_travel,    'expense', 650000, 'Vé tham quan Bảo tàng Hồ Chí Minh','Nhóm 4 người', '2026-05-19'),
(@user_id, @acc_bank, @cat_gift_out,  'expense', 350000, 'Mua điện thoại cũ tặng em gái', 'Redmi Note 10', '2026-05-22'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  68000, 'Mua phụ kiện tủ lạnh (ron)','Tiệm phụ tùng điện lạnh', '2026-05-16'),
(@user_id, @acc_bank, @cat_other_inc, 'income',  420000, 'Cashback VPBank thẻ tín dụng', 'VPBank Platinum', '2026-05-15');

-- ============================================================
-- ██████  GIAO DỊCH CUỐI – ĐẠT ĐỦ 300  ██████
-- ============================================================

-- == Tháng 2 – bổ sung thêm ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_food,      'expense', 130000, 'Đặt cơm Bento Nhật qua app',     'Bento Box Daily', '2026-02-05'),
(@user_id, @acc_cash, @cat_food,      'expense',  62000, 'Xôi lạp xưởng + sữa đậu nành', 'Xôi cô Hạnh', '2026-02-20'),
(@user_id, @acc_bank, @cat_education, 'expense', 550000, 'Thi thử IELTS Academic',        'British Council mock', '2026-02-25'),
(@user_id, @acc_bank, @cat_invest,    'income',  600000, 'Lãi tiết kiệm MB Bank tháng 2', '6.5%/năm kỳ hạn 3T', '2026-02-28'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  42000, 'Mua băng dán + keo dán tường',  'Bách hóa xanh', '2026-02-06');

-- == Tháng 3 – bổ sung thêm ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_momo, @cat_food,      'expense', 118000, 'Jollibee gà chiên + khoai',      'Jollibee Vincom Q9', '2026-03-16'),
(@user_id, @acc_cash, @cat_food,      'expense',  55000, 'Bánh flan + nước mía ép',        'Quán tráng miệng', '2026-03-29'),
(@user_id, @acc_bank, @cat_freelance, 'income',  1800000,'Thiết kế banner quảng cáo',     'Khách Tuấn Kiệt', '2026-03-20'),
(@user_id, @acc_cash, @cat_gift_out,  'expense', 320000, 'Hoa + sôcôla tặng sinh nhật',   'Tiệm hoa Mimosa', '2026-03-23'),
(@user_id, @acc_bank, @cat_education, 'expense', 399000, 'Khóa học Figma UI/UX cơ bản',  'Kyna.vn', '2026-03-14');

-- == Tháng 5 – bổ sung thêm ==
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_cash, @cat_food,      'expense',  92000, 'Mì Quảng + nước ngọt trưa',     'Mì Quảng Bà Vị', '2026-05-06'),
(@user_id, @acc_momo, @cat_food,      'expense', 156000, 'Grab Food đặt bún riêu tối',    'Bún riêu cô Thơm', '2026-05-18'),
(@user_id, @acc_cash, @cat_food,      'expense',  70000, 'Cơm gà Hải Nam ăn trưa',        'Cơm gà Chí Ký', '2026-05-20'),
(@user_id, @acc_momo, @cat_transport, 'expense',  95000, 'Be car đi nhậu về khuya',        'Be - an toàn', '2026-05-16'),
(@user_id, @acc_bank, @cat_freelance, 'income', 3200000, 'Hoàn thiện landing page bất ĐS','Khách Hùng Land', '2026-05-22'),
(@user_id, @acc_cash, @cat_other_exp, 'expense',  48000, 'Đổi gas bình loại nhỏ',         'Đại lý gas Hưng', '2026-05-10'),
(@user_id, @acc_momo, @cat_entertain, 'expense',  79000, 'Canva Pro tháng 5',              'Thiết kế đồ họa', '2026-05-01'),
(@user_id, @acc_bank, @cat_health,    'expense', 750000, 'Mua máy đo huyết áp Omron',     'Nhà thuốc Pharma', '2026-05-21');

-- ============================================================
-- CẬP NHẬT SỐ DƯ TÀI KHOẢN (tuỳ chọn, sau khi insert data)
-- ============================================================
-- UPDATE accounts SET balance = balance + 1000000
-- WHERE user_id = @user_id;

-- ============================================================
-- NGÂN SÁCH GỢI Ý CHO THÁNG 5/2026 (để test K-Means)
-- ============================================================
INSERT IGNORE INTO budgets (user_id, category_id, amount_limit, month, year) VALUES
(@user_id, @cat_food,      3500000, 5, 2026),
(@user_id, @cat_shopping,  3000000, 5, 2026),
(@user_id, @cat_transport, 1200000, 5, 2026),
(@user_id, @cat_entertain,  800000, 5, 2026),
(@user_id, @cat_health,    1500000, 5, 2026),
(@user_id, @cat_education, 2500000, 5, 2026),
(@user_id, @cat_travel,    3000000, 5, 2026);

-- ============================================================
SELECT CONCAT(
  'ML Sample Data loaded! Tổng giao dịch thêm mới: ',
  (SELECT COUNT(*) FROM transactions WHERE user_id = @user_id
   AND YEAR(transaction_date) = 2026
   AND MONTH(transaction_date) IN (2, 3, 5))
) AS status;
-- ============================================================
