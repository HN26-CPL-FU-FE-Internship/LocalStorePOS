-- =====================================================================
-- V23: REDISTRIBUTE FLOOR 1 TABLES
-- Mục đích: Sau khi V22 dồn toàn bộ bàn về Floor 1, các bàn vẫn giữ
--   toạ độ cũ của từng khu vực nên bị dồn cục trên map. Migration này
--   bố trí lại 15 bàn thành một layout rộng rãi, cân đối cho Floor 1:
--     - Lưới dining 4 hàng bên trái (R1-R3, T1-T7, O1-O2)
--     - Góc VIP bên phải (VIP1, VIP2, P1)
--   Tránh các khu vực trang trí: quầy bar (x 626-654, y 165-470),
--   bếp (x 660-960, y 520-625), lối vào (x 230-380, y > 595).
-- Chạy lại an toàn (idempotent — chỉ set toạ độ cố định).
-- =====================================================================

-- ── Row 1 (top-left, cạnh cửa sổ) ────────────────────────────────────
UPDATE restaurant_tables SET x_position = 125, y_position = 105 WHERE id = 8;  -- R1  ROUND 6
UPDATE restaurant_tables SET x_position = 305, y_position = 95  WHERE id = 9;  -- R2  RECT 4
UPDATE restaurant_tables SET x_position = 480, y_position = 110 WHERE id = 15; -- R3  ROUND 6

-- ── Row 2 (main hall) ────────────────────────────────────────────────
UPDATE restaurant_tables SET x_position = 130, y_position = 235 WHERE id = 1;  -- T1  ROUND 6
UPDATE restaurant_tables SET x_position = 305, y_position = 225 WHERE id = 2;  -- T2  ROUND 6
UPDATE restaurant_tables SET x_position = 485, y_position = 240 WHERE id = 3;  -- T3  RECT 4

-- ── Row 3 (main hall) ────────────────────────────────────────────────
UPDATE restaurant_tables SET x_position = 125, y_position = 365 WHERE id = 4;  -- T4  ROUND 6
UPDATE restaurant_tables SET x_position = 310, y_position = 355 WHERE id = 5;  -- T5  ROUND 6
UPDATE restaurant_tables SET x_position = 475, y_position = 370 WHERE id = 13; -- T6  ROUND 6

-- ── Row 4 (bottom, gần lối vào) ──────────────────────────────────────
UPDATE restaurant_tables SET x_position = 140, y_position = 490 WHERE id = 14; -- T7  ROUND 6
UPDATE restaurant_tables SET x_position = 320, y_position = 500 WHERE id = 10; -- O1  ROUND 6
UPDATE restaurant_tables SET x_position = 485, y_position = 485 WHERE id = 11; -- O2  ROUND 6

-- ── VIP corner (bên phải, trên bếp) ──────────────────────────────────
UPDATE restaurant_tables SET x_position = 735, y_position = 130 WHERE id = 6;  -- VIP1 RECT 8
UPDATE restaurant_tables SET x_position = 875, y_position = 130 WHERE id = 7;  -- VIP2 ROUND 6
UPDATE restaurant_tables SET x_position = 800, y_position = 290 WHERE id = 12; -- P1   ROUND 10
