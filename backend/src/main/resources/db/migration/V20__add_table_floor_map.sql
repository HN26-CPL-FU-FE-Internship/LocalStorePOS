-- =====================================================================
-- V20: TABLE FLOOR MAP
-- Mục đích: Hiển thị bàn dưới dạng Floor Map thay vì card grid.
--   x_position / y_position : toạ độ tâm bàn trên lưới 1000x640.
--   shape                   : ROUND | RECTANGLE (hình dạng bàn trên map).
-- Backfill vị trí cho các bàn đã seed (id 1-15) — chỉ cập nhật khi
-- bàn chưa có toạ độ (x_position IS NULL) nên migration idempotent.
-- =====================================================================

ALTER TABLE restaurant_tables
    ADD COLUMN x_position INT NULL AFTER status,
    ADD COLUMN y_position INT NULL AFTER x_position,
    ADD COLUMN shape VARCHAR(20) NULL DEFAULT 'ROUND' AFTER y_position;

-- ── Rooftop (id 8: R1, id 9: R2, id 15: R3) ─────────────────────────
UPDATE restaurant_tables SET x_position = 170, y_position = 85,  shape = 'ROUND'     WHERE id = 8  AND x_position IS NULL;
UPDATE restaurant_tables SET x_position = 340, y_position = 85,  shape = 'RECTANGLE' WHERE id = 9  AND x_position IS NULL;
UPDATE restaurant_tables SET x_position = 510, y_position = 85,  shape = 'ROUND'     WHERE id = 15 AND x_position IS NULL;

-- ── Main Hall (id 1-5, 13: T6, 14: T7) ──────────────────────────────
UPDATE restaurant_tables SET x_position = 120, y_position = 230, shape = 'ROUND'     WHERE id = 1  AND x_position IS NULL; -- T1
UPDATE restaurant_tables SET x_position = 290, y_position = 230, shape = 'ROUND'     WHERE id = 2  AND x_position IS NULL; -- T2
UPDATE restaurant_tables SET x_position = 460, y_position = 230, shape = 'RECTANGLE' WHERE id = 3  AND x_position IS NULL; -- T3 (2-seat)
UPDATE restaurant_tables SET x_position = 120, y_position = 400, shape = 'ROUND'     WHERE id = 4  AND x_position IS NULL; -- T4 (6-seat)
UPDATE restaurant_tables SET x_position = 290, y_position = 400, shape = 'ROUND'     WHERE id = 5  AND x_position IS NULL; -- T5
UPDATE restaurant_tables SET x_position = 460, y_position = 400, shape = 'ROUND'     WHERE id = 13 AND x_position IS NULL; -- T6
UPDATE restaurant_tables SET x_position = 290, y_position = 315, shape = 'ROUND'     WHERE id = 14 AND x_position IS NULL; -- T7

-- ── VIP Room (id 6: VIP1, id 7: VIP2) ───────────────────────────────
UPDATE restaurant_tables SET x_position = 750, y_position = 240, shape = 'RECTANGLE' WHERE id = 6  AND x_position IS NULL; -- VIP1 (8-seat long table)
UPDATE restaurant_tables SET x_position = 880, y_position = 240, shape = 'ROUND'     WHERE id = 7  AND x_position IS NULL; -- VIP2

-- ── Outdoor Patio (id 10: O1, id 11: O2) ────────────────────────────
UPDATE restaurant_tables SET x_position = 170, y_position = 545, shape = 'ROUND' WHERE id = 10 AND x_position IS NULL; -- O1
UPDATE restaurant_tables SET x_position = 340, y_position = 545, shape = 'ROUND' WHERE id = 11 AND x_position IS NULL; -- O2

-- ── Private Dining (id 12: P1) ──────────────────────────────────────
UPDATE restaurant_tables SET x_position = 800, y_position = 430, shape = 'ROUND' WHERE id = 12 AND x_position IS NULL; -- P1 (10-seat round)
