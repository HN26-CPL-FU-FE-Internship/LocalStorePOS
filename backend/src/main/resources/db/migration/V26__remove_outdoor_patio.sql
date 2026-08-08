-- =====================================================================
-- V26: REMOVE OUTDOOR PATIO
-- Mục đích: Bỏ khu Outdoor Patio (id 4). Hai bàn O1, O2 trong khu này
--   được chuyển sang Main Hall (id 1) với vị trí mới nằm gọn trong zone
--   Main Hall (x 45-600, y 175-535) và không chồng bàn hiện có.
--   Sau đó xoá khu vực (FK fk_tables_area đã được giải phóng).
-- Chạy lại an toàn (idempotent — UPDATE + DELETE theo id cố định).
-- =====================================================================

-- 1. Chuyển O1, O2 sang Main Hall với vị trí hợp lệ (hàng dưới cùng)
UPDATE restaurant_tables SET area_id = 1, x_position = 120, y_position = 500 WHERE id = 10; -- O1
UPDATE restaurant_tables SET area_id = 1, x_position = 430, y_position = 505 WHERE id = 11; -- O2

-- 2. Xoá khu Outdoor Patio
DELETE FROM table_areas WHERE id = 4;
