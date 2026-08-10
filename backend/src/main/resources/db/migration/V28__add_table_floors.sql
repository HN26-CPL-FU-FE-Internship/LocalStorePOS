-- =====================================================================
-- V28: TABLE FLOORS (tầng)
-- Mục đích: Thêm khái niệm "tầng" (floor) cho trang Tables. Các tầng
--   dùng chung MỘT floor-map (grid 1000x640) nhưng mỗi tầng có bộ bàn
--   riêng, độc lập với nhau (chỉ thêm/bớt bàn, mọi chức năng giữ nguyên).
--   - table_floors      : danh sách tầng (id, name).
--   - restaurant_tables.floor_id : tầng chứa bàn. Cột NULL = bàn chưa
--     xếp tầng; service luôn gán tầng khi tạo/cập nhật bàn (bàn hiện có
--     được đưa về Floor 1 bên dưới).
-- Lưu ý: KHÔNG dùng lại table_areas — đó là các khu vực (zone) cố định
--   trên map (Main Hall, VIP Room...). Tầng là một chiều dữ liệu khác.
-- =====================================================================

CREATE TABLE table_floors (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL              -- vd: Floor 1, Floor 2
) ENGINE=InnoDB;

-- Tầng mặc định cho toàn bộ bàn hiện có
INSERT INTO table_floors (name) VALUES ('Floor 1');

ALTER TABLE restaurant_tables
    ADD COLUMN floor_id BIGINT UNSIGNED NULL AFTER area_id,
    ADD CONSTRAINT fk_tables_floor FOREIGN KEY (floor_id) REFERENCES table_floors(id);

UPDATE restaurant_tables SET floor_id = 1 WHERE floor_id IS NULL;
