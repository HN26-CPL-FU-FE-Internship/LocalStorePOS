-- =====================================================================
-- V11: ADD MISSING COLUMNS AND TABLES
-- Mục đích: Bổ sung các cột/table mà entity classes đang cần nhưng
-- chưa có trong DB (phát hiện khi Hibernate ddl-auto=validate).
--
-- Danh sách:
--   1. delivery_settings: free_delivery_over, min_delivery_over
--   2. print_settings:     show_notes, print_tokens
--   3. stores:             enable_qr_menu, enable_takeaway, enable_dine_in,
--                          enable_reservation, enable_order_via_qr,
--                          enable_delivery, enable_table
--   4. notification_configs: tạo mới toàn bộ table
-- =====================================================================

-- 1. delivery_settings
ALTER TABLE delivery_settings
    ADD COLUMN free_delivery_over DECIMAL(10,2) NULL AFTER max_delivery_distance_km,
    ADD COLUMN min_delivery_over  DECIMAL(10,2) NULL AFTER free_delivery_over;

-- 2. print_settings
ALTER TABLE print_settings
    ADD COLUMN show_notes    TINYINT(1) NOT NULL DEFAULT 1 AFTER page_size,
    ADD COLUMN print_tokens  TINYINT(1) NOT NULL DEFAULT 1 AFTER show_notes;

-- 3. stores
ALTER TABLE stores
    ADD COLUMN enable_qr_menu        TINYINT(1) NOT NULL DEFAULT 1 AFTER timezone,
    ADD COLUMN enable_takeaway       TINYINT(1) NOT NULL DEFAULT 1 AFTER enable_qr_menu,
    ADD COLUMN enable_dine_in        TINYINT(1) NOT NULL DEFAULT 1 AFTER enable_takeaway,
    ADD COLUMN enable_reservation    TINYINT(1) NOT NULL DEFAULT 0 AFTER enable_dine_in,
    ADD COLUMN enable_order_via_qr   TINYINT(1) NOT NULL DEFAULT 1 AFTER enable_reservation,
    ADD COLUMN enable_delivery       TINYINT(1) NOT NULL DEFAULT 1 AFTER enable_order_via_qr,
    ADD COLUMN enable_table          TINYINT(1) NOT NULL DEFAULT 1 AFTER enable_delivery;

-- 4. notification_configs (table mới)
CREATE TABLE notification_configs (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mobile_push_enabled     TINYINT(1) NOT NULL DEFAULT 1,
    desktop_enabled         TINYINT(1) NOT NULL DEFAULT 1,
    payment_push            TINYINT(1) NOT NULL DEFAULT 1,
    payment_sms             TINYINT(1) NOT NULL DEFAULT 1,
    payment_email           TINYINT(1) NOT NULL DEFAULT 1,
    transaction_push        TINYINT(1) NOT NULL DEFAULT 1,
    transaction_sms         TINYINT(1) NOT NULL DEFAULT 1,
    transaction_email       TINYINT(1) NOT NULL DEFAULT 0,
    activity_push           TINYINT(1) NOT NULL DEFAULT 1,
    activity_sms            TINYINT(1) NOT NULL DEFAULT 1,
    activity_email          TINYINT(1) NOT NULL DEFAULT 1,
    account_push            TINYINT(1) NOT NULL DEFAULT 1,
    account_sms             TINYINT(1) NOT NULL DEFAULT 1,
    account_email           TINYINT(1) NOT NULL DEFAULT 1,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
