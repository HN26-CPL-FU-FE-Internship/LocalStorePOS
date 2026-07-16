-- =====================================================================
-- V5: USER PERMISSION OVERRIDES
-- Mục đích: cho phép custom quyền riêng cho từng user, đè lên quyền
-- mặc định lấy từ role (role_permissions).
--
-- Nguyên tắc:
--   - Mỗi cột permission để NULL  => "kế thừa" quyền từ role_permissions
--   - Mỗi cột permission set 0/1  => "override" (ghi đè) quyền của role
--   - Chỉ cần insert override cho những module thực sự cần custom,
--     không cần insert đủ cho tất cả module.
-- =====================================================================

CREATE TABLE user_permission_overrides (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  module_id         BIGINT UNSIGNED NOT NULL,

  can_view          TINYINT(1) NULL,   -- NULL = theo role, 0/1 = override
  can_add           TINYINT(1) NULL,
  can_edit          TINYINT(1) NULL,
  can_delete        TINYINT(1) NULL,
  can_export        TINYINT(1) NULL,
  can_approve_void  TINYINT(1) NULL,

  reason            VARCHAR(255) NULL,   -- lý do custom (audit, optional)
  created_by        BIGINT UNSIGNED NULL, -- admin nào set override này
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_module (user_id, module_id),
  CONSTRAINT fk_upo_user       FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_upo_module     FOREIGN KEY (module_id) REFERENCES permission_modules(id) ON DELETE CASCADE,
  CONSTRAINT fk_upo_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_upo_user ON user_permission_overrides(user_id);

-- =====================================================================
-- VIEW: quyền cuối cùng (effective permission) của từng user theo module
-- COALESCE: ưu tiên override của user, nếu NULL thì lấy từ role
-- =====================================================================
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT
  u.id                                                          AS user_id,
  pm.id                                                         AS module_id,
  pm.name                                                       AS module_name,
  COALESCE(upo.can_view,          rp.can_view,          0)      AS can_view,
  COALESCE(upo.can_add,           rp.can_add,           0)      AS can_add,
  COALESCE(upo.can_edit,          rp.can_edit,          0)      AS can_edit,
  COALESCE(upo.can_delete,        rp.can_delete,        0)      AS can_delete,
  COALESCE(upo.can_export,        rp.can_export,        0)      AS can_export,
  COALESCE(upo.can_approve_void,  rp.can_approve_void,  0)      AS can_approve_void
FROM users u
CROSS JOIN permission_modules pm
LEFT JOIN role_permissions rp
  ON rp.role_id = u.role_id AND rp.module_id = pm.id
LEFT JOIN user_permission_overrides upo
  ON upo.user_id = u.id AND upo.module_id = pm.id;