-- =====================================================================
-- V27: REBALANCE MAIN HALL TABLE LAYOUT
-- Mục đích: Các bàn Main Hall (T1-T7, T10, O1, O2, R3) bị dồn sát về
--   phía phải, khiến T3 và O2 trông như đè lên quầy bar (x ~615-660).
--   Migration này xếp lại thành lưới 3 hàng x 4 cột, trải đều trong zone
--   Main Hall (x 45-600) và lùi khỏi bar:
--     Hàng 1 (y=255): R3, T2, T1, T10
--     Hàng 2 (y=365): T3, T5, T4, T6
--     Hàng 3 (y=480): O2, T7, O1, T10 row?  ->  O2, T7, O1 + (bỏ T10 trùng)
--   Idempotent: chỉ chạy khi bàn còn ở toạ độ cũ (WHERE guard).
-- =====================================================================

-- Hàng 1
UPDATE restaurant_tables SET x_position = 110, y_position = 255 WHERE table_number = 'R3' AND x_position = 441;
UPDATE restaurant_tables SET x_position = 225, y_position = 255 WHERE table_number = 'T2' AND x_position = 315;
UPDATE restaurant_tables SET x_position = 340, y_position = 255 WHERE table_number = 'T1' AND x_position = 203;
UPDATE restaurant_tables SET x_position = 455, y_position = 255 WHERE table_number = 'T10' AND x_position = 100;

-- Hàng 2
UPDATE restaurant_tables SET x_position = 110, y_position = 370 WHERE table_number = 'T3' AND x_position = 529;
UPDATE restaurant_tables SET x_position = 225, y_position = 370 WHERE table_number = 'T5' AND x_position = 279;
UPDATE restaurant_tables SET x_position = 340, y_position = 370 WHERE table_number = 'T4' AND x_position = 178;
UPDATE restaurant_tables SET x_position = 455, y_position = 370 WHERE table_number = 'T6' AND x_position = 414;

-- Hàng 3
UPDATE restaurant_tables SET x_position = 110, y_position = 490 WHERE table_number = 'O2' AND x_position = 518;
UPDATE restaurant_tables SET x_position = 225, y_position = 490 WHERE table_number = 'T7' AND x_position = 305;
UPDATE restaurant_tables SET x_position = 340, y_position = 490 WHERE table_number = 'O1' AND x_position = 104;
