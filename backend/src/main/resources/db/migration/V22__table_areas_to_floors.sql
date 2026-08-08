-- =====================================================================
-- V22: TABLE AREAS → FLOORS
-- Mục đích: Đổi khái niệm "khu vực" (Main Hall, Rooftop, ...) thành
--   "tầng" (Floor 1, Floor 2, Floor 3). Mỗi tầng là một floor-map cố định
--   riêng và bộ lọc trên trang Tables lọc theo tầng.
--   - Đổi tên 3 khu vực đầu thành Floor 1/2/3.
--   - Dồn toàn bộ bàn hiện có về Floor 1 (các tầng khác để trống).
--   - Xoá các khu vực còn lại (Outdoor Patio, Private Dining, Secrete room)
--     sau khi đã chuyển bàn sang Floor 1 (tránh vi phạm FK fk_tables_area).
-- Idempotent: các câu lệnh dùng WHERE theo id/tên nên chạy lại an toàn.
-- =====================================================================

-- 1. Đổi tên khu vực → tầng
UPDATE table_areas SET name = 'Floor 1' WHERE id = 1 AND name <> 'Floor 1';
UPDATE table_areas SET name = 'Floor 2' WHERE id = 2 AND name <> 'Floor 2';
UPDATE table_areas SET name = 'Floor 3' WHERE id = 3 AND name <> 'Floor 3';

-- 2. Dồn toàn bộ bàn về Floor 1
UPDATE restaurant_tables SET area_id = 1 WHERE area_id IN (2, 3, 4, 5, 6);

-- 3. Xoá các khu vực không còn dùng (không bàn nào tham chiếu sau bước 2)
DELETE FROM table_areas WHERE id IN (4, 5, 6);
