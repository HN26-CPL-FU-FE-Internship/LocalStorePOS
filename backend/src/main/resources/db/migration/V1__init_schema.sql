-- =====================================================================
-- RESTAURANT POS - DATABASE SCHEMA (MySQL 8.0+)
-- Thiết kế dựa trên phân tích giao diện (HTML/Bootstrap) gồm các màn hình:
-- Items, Categories, Addons, Coupons, Table, Reservations, Customer,
-- Orders, POS, Kitchen (KDS), Invoices, Payments, Users & Roles/Permissions,
-- Store/Tax/Delivery/Payment/Print Settings.
--
-- Lưu ý: Đây là DB được suy ra từ giao diện (frontend), vui lòng đối chiếu
-- lại với nghiệp vụ thực tế trước khi triển khai production.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS restaurant_pos_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_pos_db;

-- =====================================================================
-- 1. STORE / CẤU HÌNH CHUNG
-- =====================================================================

-- Thông tin nhà hàng (thường chỉ có 1 dòng, nhưng để dạng bảng cho hệ thống
-- multi-store trong tương lai)
CREATE TABLE stores (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  image_path        VARCHAR(255) NULL,
  address_line1     VARCHAR(255) NOT NULL,
  address_line2     VARCHAR(255) NULL,
  city              VARCHAR(100) NULL,
  state             VARCHAR(100) NULL,
  country           VARCHAR(100) NULL,
  postal_code       VARCHAR(20) NULL,
  phone             VARCHAR(30) NULL,
  email             VARCHAR(150) NULL,
  currency_code     VARCHAR(10) NOT NULL DEFAULT 'USD',
  timezone          VARCHAR(60) NOT NULL DEFAULT 'UTC',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cấu hình thuế (tax-settings.html: Title, Tax Rate %, Inclusive/Exclusive)
CREATE TABLE taxes (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(100) NOT NULL,          -- CGST, SGST, IGST, VAT, Service Tax...
  tax_rate          DECIMAL(6,2) NOT NULL,           -- vd: 9.00, 18.00
  tax_type          ENUM('inclusive','exclusive') NOT NULL DEFAULT 'exclusive',
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cấu hình giao hàng (delivery-settings.html: Free Delivery, Fixed Charge, Km-based)
CREATE TABLE delivery_settings (
  id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_id                    BIGINT UNSIGNED NOT NULL,
  delivery_charge_type        ENUM('free','fixed','km_based') NOT NULL DEFAULT 'fixed',
  fixed_charge                DECIMAL(10,2) NULL,
  charge_per_km                DECIMAL(10,2) NULL,
  min_distance_for_free_km    DECIMAL(10,2) NULL,
  max_delivery_distance_km    DECIMAL(10,2) NULL,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_settings_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB;

-- Cấu hình cổng thanh toán được bật (payment-settings.html: Cash/Card/UPI/Wallet...)
CREATE TABLE payment_methods (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(30) NOT NULL UNIQUE,     -- cash, card, upi, wallet
  name              VARCHAR(100) NOT NULL,
  is_enabled        TINYINT(1) NOT NULL DEFAULT 1,
  config_json       JSON NULL,                        -- API key, merchant id... (mã hoá ở tầng app)
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cấu hình in hoá đơn (print-settings.html)
CREATE TABLE print_settings (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_id              BIGINT UNSIGNED NOT NULL,
  enable_print          TINYINT(1) NOT NULL DEFAULT 1,
  show_store_details    TINYINT(1) NOT NULL DEFAULT 1,
  show_customer_details TINYINT(1) NOT NULL DEFAULT 1,
  page_size             VARCHAR(10) NOT NULL DEFAULT 'A4', -- A1..A5
  header_text           TEXT NULL,
  footer_text           TEXT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_print_settings_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. PHÂN QUYỀN NGƯỜI DÙNG (users.html, role-permission.html)
-- =====================================================================

-- Vai trò: Admin/Owner, Supervisor, Cashier, Chef, Waiter, Delivery, Accountant...
CREATE TABLE roles (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(50) NOT NULL UNIQUE,
  is_system_role    TINYINT(1) NOT NULL DEFAULT 0,   -- Admin/Owner không được xoá/sửa
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Module hệ thống (Dashboard, POS, Orders, Products, Categories, Customers, Reports, Settings...)
CREATE TABLE permission_modules (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Ma trận quyền theo role x module (View/Add/Edit/Delete/Export/Approved-Void)
CREATE TABLE role_permissions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id           BIGINT UNSIGNED NOT NULL,
  module_id         BIGINT UNSIGNED NOT NULL,
  can_view          TINYINT(1) NOT NULL DEFAULT 0,
  can_add           TINYINT(1) NOT NULL DEFAULT 0,
  can_edit          TINYINT(1) NOT NULL DEFAULT 0,
  can_delete        TINYINT(1) NOT NULL DEFAULT 0,
  can_export        TINYINT(1) NOT NULL DEFAULT 0,
  can_approve_void  TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_role_module (role_id, module_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_module FOREIGN KEY (module_id) REFERENCES permission_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Nhân viên / người dùng hệ thống
CREATE TABLE users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id           BIGINT UNSIGNED NOT NULL,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NULL UNIQUE,
  phone_number      VARCHAR(30) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  avatar_path       VARCHAR(255) NULL,
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  last_login_at     DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- OTP / reset password (otp.html, reset-password.html, forgot-password.html)
CREATE TABLE password_resets (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  token             VARCHAR(255) NOT NULL,
  otp_code          VARCHAR(10) NULL,
  expires_at        DATETIME NOT NULL,
  used_at           DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Nhật ký audit (audit-report.html)
CREATE TABLE audit_logs (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NULL,
  action            VARCHAR(100) NOT NULL,          -- created, updated, deleted, login...
  module            VARCHAR(100) NULL,
  entity_type       VARCHAR(100) NULL,
  entity_id         BIGINT UNSIGNED NULL,
  description       TEXT NULL,
  ip_address        VARCHAR(45) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Thông báo trong hệ thống (notifications-settings.html)
CREATE TABLE notifications (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NULL,           -- NULL = broadcast toàn hệ thống
  title             VARCHAR(150) NOT NULL,
  message           TEXT NULL,
  is_read           TINYINT(1) NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. THỰC ĐƠN: CATEGORY / ITEM / VARIATION / ADDON
-- =====================================================================

-- Danh mục món ăn (categories.html)
CREATE TABLE categories (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  image_path        VARCHAR(255) NULL,
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Món ăn / sản phẩm (items.html: Name, Description, Price, Net Price, Category, Tax, Image, Veg/Non-Veg)
CREATE TABLE items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id       BIGINT UNSIGNED NOT NULL,
  tax_id            BIGINT UNSIGNED NULL,
  name              VARCHAR(150) NOT NULL,
  description       TEXT NULL,
  image_path        VARCHAR(255) NULL,
  price             DECIMAL(10,2) NOT NULL,          -- giá bán
  net_price         DECIMAL(10,2) NULL,               -- giá vốn/giá gốc
  food_type         ENUM('veg','non_veg','egg') NOT NULL DEFAULT 'veg',
  stock_quantity    INT NULL,                          -- NULL = không quản lý tồn kho
  low_stock_threshold INT NULL,
  status            ENUM('active','hidden','inactive') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_items_tax FOREIGN KEY (tax_id) REFERENCES taxes(id)
) ENGINE=InnoDB;
CREATE INDEX idx_items_category ON items(category_id);

-- Biến thể món ăn (modal Add Item > Variations: Size, Price -> vd Small/Medium/Large)
CREATE TABLE item_variations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id           BIGINT UNSIGNED NOT NULL,
  size_name         VARCHAR(50) NOT NULL,             -- Small, Medium, Large...
  price             DECIMAL(10,2) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_variations_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Addon / Topping (addons.html: Item, Addon name, Price, Description, Status)
-- Cũng dùng chung cho "Add Ons" khai báo ngay trong modal Add Item
CREATE TABLE addons (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id           BIGINT UNSIGNED NOT NULL,          -- addon gắn với 1 item cụ thể
  name              VARCHAR(150) NOT NULL,             -- Extra Cheese, Garlic Butter Sauce...
  price             DECIMAL(10,2) NOT NULL,
  description       TEXT NULL,
  image_path        VARCHAR(255) NULL,
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addons_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_addons_item ON addons(item_id);

-- =====================================================================
-- 4. KHUYẾN MÃI (coupons.html)
-- =====================================================================

CREATE TABLE coupons (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(50) NOT NULL UNIQUE,
  discount_type     ENUM('percentage','fixed_amount') NOT NULL,
  discount_amount   DECIMAL(10,2) NOT NULL,
  start_date        DATE NOT NULL,
  expiry_date       DATE NOT NULL,
  status            ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1 coupon có thể áp dụng cho nhiều category (Valid Category: multi-select)
CREATE TABLE coupon_categories (
  coupon_id         BIGINT UNSIGNED NOT NULL,
  category_id       BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (coupon_id, category_id),
  CONSTRAINT fk_coupon_categories_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 5. KHU VỰC / BÀN (table.html)
-- =====================================================================

CREATE TABLE table_areas (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL              -- vd: Main Hall, Rooftop, VIP
) ENGINE=InnoDB;

CREATE TABLE restaurant_tables (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area_id           BIGINT UNSIGNED NULL,
  table_number      VARCHAR(20) NOT NULL,               -- Table 1, Table 2...
  seats             SMALLINT UNSIGNED NOT NULL DEFAULT 4,
  status            ENUM('available','booked','occupied') NOT NULL DEFAULT 'available',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tables_area FOREIGN KEY (area_id) REFERENCES table_areas(id),
  UNIQUE KEY uq_table_number (table_number)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. KHÁCH HÀNG (customer.html)
-- =====================================================================

CREATE TABLE customers (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  phone             VARCHAR(30) NOT NULL,
  email             VARCHAR(150) NULL,
  avatar_path       VARCHAR(255) NULL,
  date_of_birth     DATE NULL,
  gender            ENUM('male','female','other') NULL,
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  is_walkin         TINYINT(1) NOT NULL DEFAULT 0,      -- Walk-in Customer (khách vãng lai)
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_phone (phone)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. ĐẶT BÀN (reservations.html)
-- =====================================================================

CREATE TABLE reservations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id       BIGINT UNSIGNED NOT NULL,
  table_id          BIGINT UNSIGNED NOT NULL,
  reservation_time  DATETIME NOT NULL,
  guests            SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  status            ENUM('booked','cancelled','completed','paid') NOT NULL DEFAULT 'booked',
  notes             TEXT NULL,
  created_by        BIGINT UNSIGNED NULL,               -- user tạo reservation
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
  CONSTRAINT fk_reservations_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX idx_reservations_time ON reservations(reservation_time);

-- =====================================================================
-- 8. ĐƠN HÀNG (orders.html, pos.html, kitchen.html)
-- =====================================================================

CREATE TABLE orders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number      VARCHAR(30) NOT NULL UNIQUE,        -- #57005
  token_no          VARCHAR(20) NULL,                    -- số thứ tự hiển thị bếp/khách
  order_type        ENUM('dine_in','take_away','delivery') NOT NULL,
  customer_id       BIGINT UNSIGNED NULL,                 -- NULL/walk-in
  table_id          BIGINT UNSIGNED NULL,                 -- chỉ có khi dine_in
  waiter_id         BIGINT UNSIGNED NULL,                 -- nhân viên phục vụ / thu ngân tạo đơn
  coupon_id         BIGINT UNSIGNED NULL,
  status            ENUM('pending','preparing','served','completed','cancelled') NOT NULL DEFAULT 'pending',
  kitchen_status    ENUM('new_order','preparing','ready','completed') NOT NULL DEFAULT 'new_order',
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_charge    DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_charge   DECIMAL(12,2) NOT NULL DEFAULT 0,
  tip_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total       DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,     -- Given Amount
  balance_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,     -- tiền thối lại
  payment_status    ENUM('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
  note              TEXT NULL,
  ordered_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
  CONSTRAINT fk_orders_waiter FOREIGN KEY (waiter_id) REFERENCES users(id),
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id)
) ENGINE=InnoDB;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_ordered_at ON orders(ordered_at);

-- Chi tiết món trong đơn hàng
CREATE TABLE order_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT UNSIGNED NOT NULL,
  item_id           BIGINT UNSIGNED NOT NULL,
  variation_id      BIGINT UNSIGNED NULL,                -- size đã chọn (nếu có)
  item_name         VARCHAR(150) NOT NULL,               -- snapshot tên tại thời điểm đặt
  unit_price        DECIMAL(10,2) NOT NULL,              -- snapshot giá tại thời điểm đặt
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  line_total        DECIMAL(12,2) NOT NULL,              -- unit_price*qty + addon - discount
  kitchen_note      VARCHAR(255) NULL,
  status            ENUM('pending','preparing','ready','served','cancelled') NOT NULL DEFAULT 'pending',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_order_items_variation FOREIGN KEY (variation_id) REFERENCES item_variations(id)
) ENGINE=InnoDB;
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Addon đã chọn cho từng dòng món trong đơn
CREATE TABLE order_item_addons (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id     BIGINT UNSIGNED NOT NULL,
  addon_id          BIGINT UNSIGNED NOT NULL,
  addon_name        VARCHAR(150) NOT NULL,               -- snapshot
  addon_price       DECIMAL(10,2) NOT NULL,              -- snapshot
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_oi_addons_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_addons_addon FOREIGN KEY (addon_id) REFERENCES addons(id)
) ENGINE=InnoDB;

-- Đơn hàng đang tạm giữ (Hold/Resume Sale - thấy trong role-permission module list)
CREATE TABLE held_orders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT UNSIGNED NOT NULL,
  held_by           BIGINT UNSIGNED NOT NULL,
  held_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resumed_at        DATETIME NULL,
  CONSTRAINT fk_held_orders_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_held_orders_user FOREIGN KEY (held_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Đổi trả / hoàn tiền (module "Refund / Return" trong role-permission)
CREATE TABLE order_refunds (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT UNSIGNED NOT NULL,
  refunded_amount   DECIMAL(12,2) NOT NULL,
  reason            TEXT NULL,
  approved_by       BIGINT UNSIGNED NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_refunds_user FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. THANH TOÁN & HOÁ ĐƠN (payments.html, invoices.html, invoice-details.html)
-- =====================================================================

-- Giao dịch thanh toán (1 đơn có thể thanh toán nhiều lần / nhiều phương thức)
CREATE TABLE payments (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id    VARCHAR(50) NOT NULL UNIQUE,        -- #23588
  order_id          BIGINT UNSIGNED NOT NULL,
  payment_method_id BIGINT UNSIGNED NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  status            ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'success',
  paid_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;
CREATE INDEX idx_payments_order ON payments(order_id);

-- Hoá đơn (invoices.html: Invoice ID, Customer, Date, Order Type, Amount, Status)
CREATE TABLE invoices (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number    VARCHAR(30) NOT NULL UNIQUE,        -- #INV0016
  order_id          BIGINT UNSIGNED NOT NULL,
  customer_id       BIGINT UNSIGNED NULL,
  invoice_date      DATE NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  status            ENUM('paid','unpaid','partial') NOT NULL DEFAULT 'unpaid',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

-- =====================================================================
-- 10. TÍCH HỢP BÊN THỨ 3 (integrations-settings.html: Google, Facebook, Gupshup, PrintNode...)
-- =====================================================================

CREATE TABLE integrations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_code     VARCHAR(50) NOT NULL UNIQUE,        -- google, facebook, gupshup, printnode
  provider_name     VARCHAR(100) NOT NULL,
  is_connected      TINYINT(1) NOT NULL DEFAULT 0,
  config_json       JSON NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA TỐI THIỂU (tham khảo cho enum/lookup)
-- =====================================================================

INSERT INTO roles (name, is_system_role) VALUES
('Admin / Owner', 1), ('Supervisor', 0), ('Cashier', 0),
('Chef', 0), ('Waiter', 0), ('Delivery', 0), ('Accountant', 0), ('System Operator', 0);

INSERT INTO permission_modules (name) VALUES
('Dashboard'), ('POS'), ('Hold/Resume Sale'), ('Refund / Return'),
('Products'), ('Categories'), ('Customers'), ('Reports'), ('Settings'),
('Orders'), ('Tables'), ('Reservation'), ('Kitchen (KDS)'), ('Invoices'),
('Payments'), ('Coupons'), ('Addons'), ('Manage Staffs'), ('Audit Logs');

INSERT INTO payment_methods (code, name, is_enabled) VALUES
('cash','Cash',1), ('card','Card',1), ('upi','UPI',1), ('wallet','Wallet',1);

INSERT INTO taxes (title, tax_rate, tax_type) VALUES
('CGST', 9.00, 'exclusive'), ('SGST', 9.00, 'exclusive'),
('IGST', 18.00, 'exclusive'), ('VAT', 10.00, 'exclusive'),
('Service Tax', 15.00, 'exclusive');