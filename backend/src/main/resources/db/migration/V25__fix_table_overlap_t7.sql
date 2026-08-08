-- =====================================================================
-- V25: FIX INITIAL TABLE OVERLAP (T7 vs O1)
-- Mục đích: Bàn T7 (Main Hall) tại (220, 500) chồng nhẹ lên O1 (Outdoor
--   Patio) tại (160, 555). Dịch T7 lên (215, 465) để map không có bàn
--   nào chồng lên nhau ngay từ đầu (tương thích với tính năng chặn kéo).
-- Chạy lại an toàn (idempotent — UPDATE cố định theo id).
-- =====================================================================

UPDATE restaurant_tables SET x_position = 215, y_position = 465 WHERE id = 14 AND x_position = 220;
