-- SCHEMA: Web Quản Lý Chi Tiêu Tích Hợp AI
-- Database: expense_management
-- MySQL 8+

DROP DATABASE IF EXISTS expense_management;
CREATE DATABASE expense_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE expense_management;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255)   NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  full_name    VARCHAR(100)   NOT NULL,
  avatar_url   VARCHAR(500)   NULL,
  currency     VARCHAR(10)    NOT NULL DEFAULT 'VND',
  theme        ENUM('light','dark') NOT NULL DEFAULT 'light',
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ACCOUNTS (Ví / Tài khoản ngân hàng)
CREATE TABLE IF NOT EXISTS accounts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED   NOT NULL,
  name         VARCHAR(100)   NOT NULL,
  type         ENUM('cash','bank','e_wallet','credit_card') NOT NULL DEFAULT 'cash',
  balance      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  color        VARCHAR(20)    NOT NULL DEFAULT '#6366f1',
  icon         VARCHAR(50)    NOT NULL DEFAULT 'Wallet',
  is_default   TINYINT(1)     NOT NULL DEFAULT 0,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_accounts_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORIES (Danh mục – hệ thống & riêng từng user)
CREATE TABLE IF NOT EXISTS categories (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED   NULL,          -- NULL = danh mục hệ thống
  parent_id    INT UNSIGNED   NULL,          -- Danh mục cha (tự tham chiếu)
  name         VARCHAR(100)   NOT NULL,
  type         ENUM('income','expense') NOT NULL,
  icon         VARCHAR(50)    NOT NULL DEFAULT 'Tag',
  color        VARCHAR(20)    NOT NULL DEFAULT '#6366f1',
  is_default   TINYINT(1)     NOT NULL DEFAULT 0,

  CONSTRAINT fk_categories_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
    REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_categories_user_id (user_id),
  INDEX idx_categories_type (type),
  INDEX idx_categories_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TRANSACTIONS (Giao dịch thu/chi)
CREATE TABLE IF NOT EXISTS transactions (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED   NOT NULL,
  account_id       INT UNSIGNED   NOT NULL,
  category_id      INT UNSIGNED   NOT NULL,
  type             ENUM('income','expense') NOT NULL,
  amount           DECIMAL(15,2)  NOT NULL,
  description      VARCHAR(255)   NOT NULL DEFAULT '',
  note             TEXT           NULL,
  image_url        VARCHAR(500)   NULL,
  transaction_date DATE           NOT NULL,
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transactions_user     FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_transactions_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE RESTRICT,

  INDEX idx_transactions_user_id          (user_id),
  INDEX idx_transactions_account_id       (account_id),
  INDEX idx_transactions_category_id      (category_id),
  INDEX idx_transactions_date             (transaction_date),
  INDEX idx_transactions_user_date        (user_id, transaction_date),
  INDEX idx_transactions_user_type        (user_id, type),
  INDEX idx_transactions_user_cat_date    (user_id, category_id, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BUDGETS (Ngân sách theo tháng)
CREATE TABLE IF NOT EXISTS budgets (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED   NOT NULL,
  category_id  INT UNSIGNED   NOT NULL,
  amount_limit DECIMAL(15,2)  NOT NULL,
  month        TINYINT        NOT NULL COMMENT '1-12',
  year         INT            NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  account_ids  JSON           NULL COMMENT 'JSON array of account IDs linked to this budget. NULL = no wallet linked.',

  CONSTRAINT fk_budgets_user     FOREIGN KEY (user_id)    REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_budget_user_cat_month_year (user_id, category_id, month, year),
  INDEX idx_budgets_user_month_year (user_id, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TRANSFERS (Chuyển tiền giữa các ví)
CREATE TABLE IF NOT EXISTS transfers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED   NOT NULL,
  from_account_id INT UNSIGNED   NOT NULL,
  to_account_id   INT UNSIGNED   NOT NULL,
  amount          DECIMAL(15,2)  NOT NULL,
  fee             DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  description     VARCHAR(255)   NULL,
  transfer_date   DATE           NOT NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transfers_user         FOREIGN KEY (user_id)         REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_transfers_from_account FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_transfers_to_account   FOREIGN KEY (to_account_id)   REFERENCES accounts(id) ON DELETE RESTRICT,

  INDEX idx_transfers_user_id       (user_id),
  INDEX idx_transfers_from_account  (from_account_id),
  INDEX idx_transfers_to_account    (to_account_id),
  INDEX idx_transfers_date          (transfer_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. RECURRING TRANSACTIONS (Giao dịch định kỳ)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED   NOT NULL,
  account_id   INT UNSIGNED   NOT NULL,
  category_id  INT UNSIGNED   NOT NULL,
  type         ENUM('income','expense') NOT NULL,
  amount       DECIMAL(15,2)  NOT NULL,
  description  VARCHAR(255)   NOT NULL DEFAULT '',
  frequency    ENUM('daily','weekly','monthly','yearly') NOT NULL,
  start_date   DATE           NOT NULL,
  next_date    DATE           NOT NULL,
  is_active    TINYINT(1)     NOT NULL DEFAULT 1,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_recurring_user     FOREIGN KEY (user_id)    REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_recurring_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_recurring_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

  INDEX idx_recurring_user_id    (user_id),
  INDEX idx_recurring_next_date  (next_date),
  INDEX idx_recurring_is_active  (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AI_CONVERSATIONS (Phiên chat AI)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED  NOT NULL,
  title      VARCHAR(255)  NOT NULL DEFAULT 'Cuộc trò chuyện mới',
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ai_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ai_conv_user_id (user_id),
  INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AI_MESSAGES (Tin nhắn trong phiên chat)
CREATE TABLE IF NOT EXISTS ai_messages (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED  NOT NULL,
  role            ENUM('user','assistant') NOT NULL,
  content         TEXT          NOT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ai_msg_conversation FOREIGN KEY (conversation_id)
    REFERENCES ai_conversations(id) ON DELETE CASCADE,
  INDEX idx_ai_msg_conversation_id (conversation_id),
  INDEX idx_ai_msg_created_at      (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATIONS (Thông báo)
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  message     TEXT          NOT NULL,
  type        ENUM('budget_warning','recurring','system','transfer') NOT NULL DEFAULT 'system',
  is_read     TINYINT(1)    NOT NULL DEFAULT 0,
  related_id  INT           NULL COMMENT 'ID liên quan (transaction_id, budget_id...)',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_id   (user_id),
  INDEX idx_notifications_is_read   (is_read),
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. FINANCIAL_HEALTH_SCORES (Điểm sức khoẻ tài chính)
CREATE TABLE IF NOT EXISTS financial_health_scores (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  month            TINYINT NOT NULL COMMENT '1-12',
  year             INT NOT NULL,
  total_score      INT NOT NULL DEFAULT 0,
  grade            VARCHAR(20),
  score_savings    INT DEFAULT 0,
  score_budget     INT DEFAULT 0,
  score_stability  INT DEFAULT 0,
  score_diversity  INT DEFAULT 0,
  score_trend      INT DEFAULT 0,
  savings_rate     DECIMAL(5,2) DEFAULT 0,
  cv_value         DECIMAL(5,2) DEFAULT 0,
  income_sources   INT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_month_year (user_id, month, year),
  CONSTRAINT fk_health_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_health_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. SPENDING_METHODS (Quy tắc/Chiến lược chi tiêu)
CREATE TABLE IF NOT EXISTS spending_methods (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED   NULL,
  name         VARCHAR(100)   NOT NULL,
  description  TEXT           NULL,
  icon         VARCHAR(10)    NULL DEFAULT '📊',
  is_system    TINYINT(1)     NOT NULL DEFAULT 0,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_spending_methods_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_spending_methods_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. METHOD_ALLOCATIONS (Tỷ lệ phân chia của quy tắc)
CREATE TABLE IF NOT EXISTS method_allocations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  method_id    INT            NOT NULL,
  label        VARCHAR(100)   NOT NULL,
  percentage   DECIMAL(5,2)   NOT NULL,
  color        VARCHAR(20)    NULL DEFAULT '#2563eb',
  sort_order   INT            NOT NULL DEFAULT 0,

  CONSTRAINT fk_allocations_method FOREIGN KEY (method_id) REFERENCES spending_methods(id) ON DELETE CASCADE,
  INDEX idx_allocations_method (method_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA: Web Quản Lý Chi Tiêu Tích Hợp AI
-- Chạy SAU khi đã chạy schema.sql

USE expense_management;


-- CATEGORIES HỆ THỐNG (user_id = NULL, is_default = 1)
-- CHI TIÊU (expense)
INSERT INTO categories (user_id, parent_id, name, type, icon, color, is_default) VALUES
(NULL, NULL, 'Ăn uống',      'expense', 'UtensilsCrossed', '#f59e0b', 1),
(NULL, NULL, 'Di chuyển',    'expense', 'Car',              '#3b82f6', 1),
(NULL, NULL, 'Mua sắm',      'expense', 'ShoppingBag',      '#ec4899', 1),
(NULL, NULL, 'Giải trí',     'expense', 'Gamepad2',         '#8b5cf6', 1),
(NULL, NULL, 'Sức khỏe',     'expense', 'HeartPulse',       '#ef4444', 1),
(NULL, NULL, 'Giáo dục',     'expense', 'BookOpen',         '#06b6d4', 1),
(NULL, NULL, 'Hóa đơn',      'expense', 'FileText',         '#64748b', 1),
(NULL, NULL, 'Nhà ở',        'expense', 'Home',             '#10b981', 1),
(NULL, NULL, 'Làm đẹp',      'expense', 'Sparkles',         '#f43f5e', 1),
(NULL, NULL, 'Du lịch',      'expense', 'Plane',            '#0ea5e9', 1),
(NULL, NULL, 'Quà tặng',     'expense', 'Gift',             '#a855f7', 1),
(NULL, NULL, 'Chi khác',     'expense', 'MoreHorizontal',   '#94a3b8', 1);

-- THU NHẬP (income)
INSERT INTO categories (user_id, parent_id, name, type, icon, color, is_default) VALUES
(NULL, NULL, 'Lương',        'income',  'Banknote',         '#22c55e', 1),
(NULL, NULL, 'Thưởng',       'income',  'Trophy',           '#f59e0b', 1),
(NULL, NULL, 'Đầu tư',       'income',  'TrendingUp',       '#3b82f6', 1),
(NULL, NULL, 'Freelance',    'income',  'Laptop',           '#8b5cf6', 1),
(NULL, NULL, 'Quà nhận',     'income',  'Gift',             '#ec4899', 1),
(NULL, NULL, 'Thu khác',     'income',  'PlusCircle',       '#94a3b8', 1);

-- USER TEST
-- email: test@gmail.com | password: 123456
-- Bcrypt hash của "123456" với saltRounds=10
INSERT INTO users (email, password_hash, full_name, currency, theme) VALUES
('test@gmail.com',
 '$2a$10$qB1CUFCeOxyqGkkoLaP0Te5LeJPryHNQMkwdLt4DDzarrFIsBZx2.',
 'Nguyễn Test User', 'VND', 'light');

-- Lấy user_id vừa tạo
SET @user_id = LAST_INSERT_ID();

-- TÀI KHOẢN MẪU
INSERT INTO accounts (user_id, name, type, balance, color, icon, is_default) VALUES
(@user_id, 'Tiền mặt', 'cash',     2000000.00,  '#f59e0b', 'Wallet',     1),
(@user_id, 'MB Bank',  'bank',     15000000.00, '#2563eb', 'CreditCard', 0),
(@user_id, 'MoMo',     'e_wallet',   500000.00, '#a855f7', 'Smartphone', 0);

SET @acc_cash  = (SELECT id FROM accounts WHERE user_id = @user_id AND name = 'Tiền mặt');
SET @acc_bank  = (SELECT id FROM accounts WHERE user_id = @user_id AND name = 'MB Bank');
SET @acc_momo  = (SELECT id FROM accounts WHERE user_id = @user_id AND name = 'MoMo');

-- LẤY ID DANH MỤC HỆ THỐNG
SET @cat_food       = (SELECT id FROM categories WHERE name = 'Ăn uống'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_transport  = (SELECT id FROM categories WHERE name = 'Di chuyển' AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_shopping   = (SELECT id FROM categories WHERE name = 'Mua sắm'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_entertain  = (SELECT id FROM categories WHERE name = 'Giải trí'  AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_health     = (SELECT id FROM categories WHERE name = 'Sức khỏe'  AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_education  = (SELECT id FROM categories WHERE name = 'Giáo dục'  AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_bills      = (SELECT id FROM categories WHERE name = 'Hóa đơn'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_housing    = (SELECT id FROM categories WHERE name = 'Nhà ở'     AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_beauty     = (SELECT id FROM categories WHERE name = 'Làm đẹp'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_travel     = (SELECT id FROM categories WHERE name = 'Du lịch'   AND type = 'expense' AND user_id IS NULL LIMIT 1);
SET @cat_salary     = (SELECT id FROM categories WHERE name = 'Lương'     AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_bonus      = (SELECT id FROM categories WHERE name = 'Thưởng'    AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_invest     = (SELECT id FROM categories WHERE name = 'Đầu tư'    AND type = 'income'  AND user_id IS NULL LIMIT 1);
SET @cat_freelance  = (SELECT id FROM categories WHERE name = 'Freelance'  AND type = 'income'  AND user_id IS NULL LIMIT 1);

-- GIAO DỊCH 3 THÁNG GẦN NHẤT (40+ giao dịch để test báo cáo)

--   2 THÁNG TRƯỚC 
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
(@user_id, @acc_bank,  @cat_salary,    'income',  12000000, 'Lương tháng',                DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')),
(@user_id, @acc_bank,  @cat_food,      'expense',  850000,  'Ăn uống cả tháng',           DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-05')),
(@user_id, @acc_cash,  @cat_transport, 'expense',  300000,  'Đi lại tháng',               DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-08')),
(@user_id, @acc_bank,  @cat_bills,     'expense', 1200000,  'Tiền điện nước',             DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-10')),
(@user_id, @acc_bank,  @cat_housing,   'expense', 3000000,  'Tiền thuê nhà',              DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')),
(@user_id, @acc_cash,  @cat_shopping,  'expense',  650000,  'Mua đồ dùng',                DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-15')),
(@user_id, @acc_bank,  @cat_health,    'expense',  500000,  'Khám sức khỏe',              DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-20')),
(@user_id, @acc_bank,  @cat_freelance, 'income',  2000000,  'Thu nhập thêm',              DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-25'));

--  THÁNG TRƯỚC 
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
(@user_id, @acc_bank,  @cat_salary,    'income',  12000000, 'Lương tháng',                DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')),
(@user_id, @acc_bank,  @cat_bonus,     'income',   1500000, 'Thưởng hoàn thành dự án',   DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-05')),
(@user_id, @acc_cash,  @cat_food,      'expense',   85000,  'Cơm trưa văn phòng',        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-02')),
(@user_id, @acc_cash,  @cat_food,      'expense',  120000,  'Coffee với đồng nghiệp',    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-04')),
(@user_id, @acc_bank,  @cat_shopping,  'expense',  350000,  'Mua áo H&M',                DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-06')),
(@user_id, @acc_momo,  @cat_transport, 'expense',  200000,  'Grab đi làm cả tuần',       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-08')),
(@user_id, @acc_bank,  @cat_bills,     'expense', 1200000,  'Tiền điện tháng',            DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-10')),
(@user_id, @acc_cash,  @cat_entertain, 'expense',  450000,  'Netflix + Spotify',          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-12')),
(@user_id, @acc_bank,  @cat_housing,   'expense', 3000000,  'Tiền thuê nhà tháng',        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')),
(@user_id, @acc_cash,  @cat_food,      'expense',  250000,  'Đi ăn sinh nhật bạn',       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-14')),
(@user_id, @acc_bank,  @cat_health,    'expense',  800000,  'Khám sức khỏe định kỳ',     DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-16')),
(@user_id, @acc_bank,  @cat_education, 'expense',  180000,  'Mua sách Atomic Habits',    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-18')),
(@user_id, @acc_momo,  @cat_beauty,    'expense',  300000,  'Cắt tóc + dưỡng da',        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-20')),
(@user_id, @acc_bank,  @cat_invest,    'income',  1000000,  'Cổ tức chứng khoán',         DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-22')),
(@user_id, @acc_bank,  @cat_travel,    'expense',  500000,  'Đặt vé xe đi Đà Lạt',       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-24')),
(@user_id, @acc_bank,  @cat_freelance, 'income',  2500000,  'Dự án thiết kế web',         DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-26'));

-- THÁNG HIỆN TẠI 
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, note, transaction_date) VALUES
(@user_id, @acc_bank,  @cat_salary,    'income',  12000000, 'Lương tháng này',            '', DATE_FORMAT(CURDATE(), '%Y-%m-01')),
(@user_id, @acc_bank,  @cat_housing,   'expense', 3000000,  'Tiền thuê nhà',              '', DATE_FORMAT(CURDATE(), '%Y-%m-01')),
(@user_id, @acc_cash,  @cat_food,      'expense',   85000,  'Cơm trưa văn phòng',        '', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(@user_id, @acc_bank,  @cat_shopping,  'expense',  350000,  'Mua áo H&M',                'Sale 30%', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(@user_id, @acc_momo,  @cat_transport, 'expense',  200000,  'Grab đi làm cả tuần',       '', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@user_id, @acc_bank,  @cat_bills,     'expense', 1200000,  'Tiền điện tháng',            '', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@user_id, @acc_cash,  @cat_entertain, 'expense',  450000,  'Netflix + Spotify',          'Gia hạn 3 tháng', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(@user_id, @acc_bank,  @cat_freelance, 'income',  2500000,  'Dự án thiết kế web',         '', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(@user_id, @acc_cash,  @cat_food,      'expense',  120000,  'Coffee với khách hàng',     '', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(@user_id, @acc_bank,  @cat_health,    'expense',  800000,  'Khám sức khỏe định kỳ',     'Bệnh viện FV', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(@user_id, @acc_cash,  @cat_food,      'expense',  250000,  'Đi ăn sinh nhật bạn',       '', DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(@user_id, @acc_bank,  @cat_bonus,     'income',   500000,  'Thưởng hoàn thành dự án',   '', DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(@user_id, @acc_bank,  @cat_shopping,  'expense',  650000,  'Mua đồ dùng gia đình',      'IKEA', DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(@user_id, @acc_cash,  @cat_food,      'expense',   90000,  'Bún bò Huế',                '', DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
(@user_id, @acc_bank,  @cat_education, 'expense',  180000,  'Mua sách lập trình',        '', DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
(@user_id, @acc_momo,  @cat_beauty,    'expense',  300000,  'Cắt tóc + dưỡng da',        '', DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
(@user_id, @acc_bank,  @cat_invest,    'income',  1000000,  'Cổ tức chứng khoán',         '', DATE_SUB(CURDATE(), INTERVAL 11 DAY)),
(@user_id, @acc_bank,  @cat_travel,    'expense',  500000,  'Đặt vé xe đi Đà Lạt',       '', DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
(@user_id, @acc_cash,  @cat_food,      'expense',  150000,  'Đặt đồ ăn Baemin',          '', DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
(@user_id, @acc_momo,  @cat_transport, 'expense',  400000,  'Đổ xăng xe máy',            '', DATE_SUB(CURDATE(), INTERVAL 14 DAY));

-- NGÂN SÁCH THÁNG HIỆN TẠI
INSERT INTO budgets (user_id, category_id, amount_limit, month, year) VALUES
(@user_id, @cat_food,      3000000, MONTH(CURDATE()), YEAR(CURDATE())),
(@user_id, @cat_shopping,  2000000, MONTH(CURDATE()), YEAR(CURDATE())),
(@user_id, @cat_transport, 1000000, MONTH(CURDATE()), YEAR(CURDATE())),
(@user_id, @cat_entertain,  500000, MONTH(CURDATE()), YEAR(CURDATE())),
(@user_id, @cat_health,    1500000, MONTH(CURDATE()), YEAR(CURDATE()));

-- THÔNG BÁO MẪU
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(@user_id, 'Chào mừng!', 'Chào mừng bạn đến với Web Quản Lý Chi Tiêu. Hãy bắt đầu theo dõi chi tiêu của bạn ngay!', 'system', 0),
(@user_id, 'Ngân sách Ăn uống gần đạt giới hạn', 'Bạn đã chi 73% ngân sách Ăn uống tháng này. Hãy cân nhắc chi tiêu!', 'budget_warning', 0);

-- PHƯƠNG PHÁP & CHIẾN LƯỢC CHI TIÊU HỆ THỐNG
INSERT INTO spending_methods (id, user_id, name, description, icon, is_system) VALUES
(1, NULL, 'Quy tắc 50/30/20', 'Phân chia thu nhập thành 3 nhóm: Nhu cầu thiết yếu (50%), Mong muốn (30%) và Tiết kiệm (20%). Lí tưởng cho người mới bắt đầu.', '🍕', 1),
(2, NULL, 'Quy tắc 6 chiếc lọ', 'Chia thu nhập vào 6 lọ với mục đích rõ ràng, giúp cân bằng giữa chi tiêu hiện tại và tương lai tài chính.', '🍯', 1),
(3, NULL, 'Quy tắc 70/20/10', 'Đơn giản hoá tài chính cá nhân: 70% chi tiêu cuộc sống, 20% tiết kiệm & đầu tư, 10% trả nợ hoặc từ thiện.', '📊', 1);

INSERT INTO method_allocations (method_id, label, percentage, color, sort_order) VALUES
(1, 'Nhu cầu thiết yếu', 50.00, '#2563EB', 1),
(1, 'Mong muốn & Giải trí', 30.00, '#7C3AED', 2),
(1, 'Tiết kiệm & Đầu tư', 20.00, '#16A34A', 3),
(2, 'Chi tiêu thiết yếu', 55.00, '#2563EB', 1),
(2, 'Tự do tài chính', 10.00, '#16A34A', 2),
(2, 'Giáo dục & Phát triển', 10.00, '#D97706', 3),
(2, 'Hưởng thụ', 10.00, '#EC4899', 4),
(2, 'Tiết kiệm dài hạn', 10.00, '#059669', 5),
(2, 'Từ thiện & Đóng góp', 5.00, '#DC2626', 6),
(3, 'Chi tiêu cuộc sống', 70.00, '#2563EB', 1),
(3, 'Tiết kiệm & Đầu tư', 20.00, '#16A34A', 2),
(3, 'Trả nợ & Từ thiện', 10.00, '#D97706', 3);

SELECT 'Seed completed successfully!' AS status;
