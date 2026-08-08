-- =====================================================================
-- V24: RESTORE FIXED ZONES (khôi phục các khu vực cố định)
-- Mục đích: Quay lại thiết kế map có các khu vực (zone) như ban đầu:
--   Main Hall, VIP Room, Rooftop, Outdoor Patio, Private Dining.
--   Các khu vực này là CỐ ĐỊNH theo map (không chỉnh sửa trong UI).
--   Mỗi bàn được gán về đúng khu vực gốc + vị trí trong zone đó.
-- Chạy lại an toàn (idempotent — rename + insert-if-missing + UPDATE cố định).
-- =====================================================================

-- ── 1. Đổi tên 3 tầng (do V22 đặt) về khu vực gốc ─────────────────────
UPDATE table_areas SET name = 'Main Hall' WHERE id = 1 AND name <> 'Main Hall';
UPDATE table_areas SET name = 'VIP Room'  WHERE id = 2 AND name <> 'VIP Room';
UPDATE table_areas SET name = 'Rooftop'   WHERE id = 3 AND name <> 'Rooftop';

-- ── 2. Khôi phục 2 khu vực đã bị V22 xoá (nếu chưa tồn tại) ────────────
INSERT INTO table_areas (id, name)
SELECT 4, 'Outdoor Patio'
WHERE NOT EXISTS (SELECT 1 FROM table_areas WHERE id = 4);

INSERT INTO table_areas (id, name)
SELECT 5, 'Private Dining'
WHERE NOT EXISTS (SELECT 1 FROM table_areas WHERE id = 5);

-- ── 3. Gán bàn về đúng khu vực gốc ────────────────────────────────────
-- Main Hall (id 1): T1-T7
UPDATE restaurant_tables SET area_id = 1 WHERE id IN (1, 2, 3, 4, 5, 13, 14);
-- VIP Room (id 2): VIP1, VIP2
UPDATE restaurant_tables SET area_id = 2 WHERE id IN (6, 7);
-- Rooftop (id 3): R1, R2, R3
UPDATE restaurant_tables SET area_id = 3 WHERE id IN (8, 9, 15);
-- Outdoor Patio (id 4): O1, O2
UPDATE restaurant_tables SET area_id = 4 WHERE id IN (10, 11);
-- Private Dining (id 5): P1
UPDATE restaurant_tables SET area_id = 5 WHERE id = 12;

-- ── 4. Vị trí bàn theo zone (grid 1000x640) ───────────────────────────
-- Rooftop (dải trên cùng, sát cửa sổ)
UPDATE restaurant_tables SET x_position = 140, y_position = 100 WHERE id = 8;  -- R1  ROUND 6
UPDATE restaurant_tables SET x_position = 330, y_position = 95  WHERE id = 9;  -- R2  RECT 4
UPDATE restaurant_tables SET x_position = 520, y_position = 100 WHERE id = 15; -- R3  ROUND 6

-- VIP Room (góc trên bên phải)
UPDATE restaurant_tables SET x_position = 755, y_position = 130 WHERE id = 6;  -- VIP1 RECT 8
UPDATE restaurant_tables SET x_position = 880, y_position = 130 WHERE id = 7;  -- VIP2 ROUND 6

-- Main Hall (khu trung tâm bên trái)
UPDATE restaurant_tables SET x_position = 120, y_position = 240 WHERE id = 1;  -- T1  ROUND 6
UPDATE restaurant_tables SET x_position = 290, y_position = 230 WHERE id = 2;  -- T2  ROUND 6
UPDATE restaurant_tables SET x_position = 460, y_position = 245 WHERE id = 3;  -- T3  RECT 4
UPDATE restaurant_tables SET x_position = 120, y_position = 380 WHERE id = 4;  -- T4  ROUND 6
UPDATE restaurant_tables SET x_position = 290, y_position = 370 WHERE id = 5;  -- T5  ROUND 6
UPDATE restaurant_tables SET x_position = 460, y_position = 385 WHERE id = 13; -- T6  ROUND 6
UPDATE restaurant_tables SET x_position = 220, y_position = 500 WHERE id = 14; -- T7  ROUND 6

-- Outdoor Patio (góc dưới bên trái, gần lối vào)
UPDATE restaurant_tables SET x_position = 160, y_position = 555 WHERE id = 10; -- O1  ROUND 6
UPDATE restaurant_tables SET x_position = 380, y_position = 555 WHERE id = 11; -- O2  ROUND 6

-- Private Dining (góc dưới bên phải, trên khu bếp)
UPDATE restaurant_tables SET x_position = 800, y_position = 390 WHERE id = 12; -- P1  ROUND 10
