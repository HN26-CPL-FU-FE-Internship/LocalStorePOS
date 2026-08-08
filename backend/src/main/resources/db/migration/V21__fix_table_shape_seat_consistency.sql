-- =====================================================================
-- V21: FIX TABLE SHAPE / SEAT CONSISTENCY + REMOVE TEST TABLES
-- Mục đích:
--   1) Xoá 2 bàn test rác (TEst id=19, hbhhggh id=20) — không có
--      reservation/order tham chiếu (đã kiểm tra trước khi xoá).
--   2) Đảm bảo mọi bàn thoả quy tắc shape/seats của ứng dụng:
--      ROUND (6, 8, 10 seats) | RECTANGLE (4, 6, 8 seats).
--      Các bàn seed cũ có seats 2/4 không hợp lệ sẽ được đưa về
--      giá trị hợp lệ của shape tương ứng (ROUND 2/4 → 6, RECTANGLE 2 → 4).
-- Idempotent: chỉ UPDATE những bàn còn sai, nên chạy lại an toàn.
-- =====================================================================

-- 1. Dọn dẹp bàn test (xoá dữ liệu phụ thuộc trước nếu có)
DELETE FROM reservations WHERE table_id IN (19, 20);
DELETE FROM orders WHERE table_id IN (19, 20);
DELETE FROM restaurant_tables WHERE id IN (19, 20);

-- 2. Sửa seats cho khớp shape (ROUND 6/8/10, RECTANGLE 4/6/8)
UPDATE restaurant_tables
SET seats = CASE WHEN shape = 'RECTANGLE' THEN 4 ELSE 6 END
WHERE (shape = 'RECTANGLE' AND seats NOT IN (4, 6, 8))
   OR (COALESCE(shape, 'ROUND') != 'RECTANGLE' AND seats NOT IN (6, 8, 10));
