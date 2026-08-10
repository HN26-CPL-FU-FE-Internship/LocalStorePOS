-- =====================================================================
-- V32: REMOVE ALL SEED/DEMO DATA
-- Mục đích: Xoá toàn bộ dữ liệu seed (Golden Dragon demo) để bắt đầu
--   với DB sạch, nhập dữ liệu thật qua web.
--
-- GIỮ LẠI (reference/structural data — app vỡ nếu thiếu):
--   - roles, permission_modules, role_permissions  (V1/V6: phân quyền)
--   - payment_methods                              (V1/V17: thanh toán)
--   - taxes                                        (V1: thuế)
--   - stores (row id=1)                            (Settings yêu cầu store)
--   - table_areas, table_floors                    (V22/V24/V29: cấu trúc tầng)
--
-- XOÁ (demo data):
--   Toàn bộ rows business: items, categories, addons, customers, coupons,
--   reservations, orders + children, payments, audit_logs, users (demo),
--   restaurant_tables, delivery/print settings (service tự tạo lại khi cần).
--
-- An toàn trên cả DB cũ lẫn DB mới: không sửa checksum migration cũ.
-- Idempotent: chạy lại không lỗi.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. ORDERS & CHILDREN
-- =====================================================================
DELETE FROM order_item_addons;
DELETE FROM order_items;
DELETE FROM order_refunds;
DELETE FROM held_orders;
DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM order_sequences;

-- =====================================================================
-- 2. MENU
-- =====================================================================
DELETE FROM addons;
DELETE FROM item_variations;
DELETE FROM items;
DELETE FROM categories;

-- =====================================================================
-- 3. COUPONS
-- =====================================================================
DELETE FROM coupon_categories;
DELETE FROM coupons;

-- =====================================================================
-- 4. BOOKINGS & CUSTOMERS
-- =====================================================================
DELETE FROM reservations;
DELETE FROM customers;

-- =====================================================================
-- 5. PEOPLE (giữ admin@pos.com — BootstrapService tự tạo lại nếu thiếu)
-- =====================================================================
DELETE FROM user_permission_overrides;
DELETE FROM password_resets;
DELETE FROM user_sessions;
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM notification_configs;
DELETE FROM approval_requests;
DELETE FROM integrations;
DELETE FROM users WHERE email <> 'admin@pos.com';

-- =====================================================================
-- 6. BÀN (demo tables — user tạo lại qua UI)
-- =====================================================================
DELETE FROM restaurant_tables;

-- =====================================================================
-- 7. SETTINGS (service tự tạo lại với default khi truy cập)
-- =====================================================================
DELETE FROM delivery_settings;
DELETE FROM print_settings;

SET FOREIGN_KEY_CHECKS = 1;
