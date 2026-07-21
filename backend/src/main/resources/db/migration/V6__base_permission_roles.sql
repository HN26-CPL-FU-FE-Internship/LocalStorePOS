-- =====================================================================
-- V6: BASE PERMISSION ROLES (SEED DATA)
-- Mục đích: Khởi tạo ma trận quyền mặc định (role_permissions) cho từng
-- vai trò (roles) x từng module (permission_modules), dựa theo nghiệp vụ
-- nhà hàng thực tế.
--
-- Nguyên tắc:
--   - Dữ liệu này là DEFAULT / BASELINE, dùng làm điểm khởi đầu.
--   - Có thể chỉnh sửa qua màn hình Role & Permission sau khi deploy.
--   - Nếu 1 user cần custom riêng lẻ, dùng bảng user_permission_overrides
--     (V5) thay vì sửa trực tiếp role_permissions ở đây.
--   - Roles và permission_modules đã được seed sẵn ở V1 (init_schema).
--
-- Ma trận quyền theo role:
--   Admin / Owner    : full access tất cả module (chủ nhà hàng)
--   Supervisor        : gần full quyền vận hành, hạn chế Delete/Settings
--   Cashier            : tập trung POS / Orders / Payments / Invoices
--   Chef                : tập trung Kitchen (KDS), chỉ xem Products/Orders
--   Waiter              : tập trung POS / Orders / Tables / Reservation
--   Delivery            : tập trung Orders (giao hàng) / Payments (thu hộ)
--   Accountant         : tập trung Reports / Invoices / Payments / Refund
--   System Operator   : tập trung Settings / Manage Staffs / Audit Logs
-- =====================================================================

INSERT INTO role_permissions
  (role_id, module_id, can_view, can_add, can_edit, can_delete, can_export, can_approve_void)
SELECT
  r.id, m.id,
  v.can_view, v.can_add, v.can_edit, v.can_delete, v.can_export, v.can_approve_void
FROM (
  VALUES
    -- =================================================================
    -- ADMIN / OWNER — full quyền trên toàn bộ module
    -- =================================================================
    ROW('Admin / Owner', 'Dashboard',         1,1,1,1,1,1),
    ROW('Admin / Owner', 'POS',               1,1,1,1,1,1),
    ROW('Admin / Owner', 'Hold/Resume Sale',  1,1,1,1,1,1),
    ROW('Admin / Owner', 'Refund / Return',   1,1,1,1,1,1),
    ROW('Admin / Owner', 'Products',          1,1,1,1,1,1),
    ROW('Admin / Owner', 'Categories',        1,1,1,1,1,1),
    ROW('Admin / Owner', 'Customers',         1,1,1,1,1,1),
    ROW('Admin / Owner', 'Reports',           1,1,1,1,1,1),
    ROW('Admin / Owner', 'Settings',          1,1,1,1,1,1),
    ROW('Admin / Owner', 'Orders',            1,1,1,1,1,1),
    ROW('Admin / Owner', 'Tables',            1,1,1,1,1,1),
    ROW('Admin / Owner', 'Reservation',       1,1,1,1,1,1),
    ROW('Admin / Owner', 'Kitchen (KDS)',     1,1,1,1,1,1),
    ROW('Admin / Owner', 'Invoices',          1,1,1,1,1,1),
    ROW('Admin / Owner', 'Payments',          1,1,1,1,1,1),
    ROW('Admin / Owner', 'Coupons',           1,1,1,1,1,1),
    ROW('Admin / Owner', 'Addons',            1,1,1,1,1,1),
    ROW('Admin / Owner', 'Manage Staffs',     1,1,1,1,1,1),
    ROW('Admin / Owner', 'Audit Logs',        1,1,1,1,1,1),

    -- =================================================================
    -- SUPERVISOR — vận hành hằng ngày, hạn chế Delete và Settings
    -- =================================================================
    ROW('Supervisor', 'Dashboard',         1,0,0,0,0,0),
    ROW('Supervisor', 'POS',               1,1,1,0,1,1),
    ROW('Supervisor', 'Hold/Resume Sale',  1,1,1,0,0,0),
    ROW('Supervisor', 'Refund / Return',   1,1,0,0,0,1),
    ROW('Supervisor', 'Products',          1,1,1,0,0,0),
    ROW('Supervisor', 'Categories',        1,1,1,0,0,0),
    ROW('Supervisor', 'Customers',         1,1,1,0,0,0),
    ROW('Supervisor', 'Reports',           1,0,0,0,1,0),
    ROW('Supervisor', 'Settings',          1,0,0,0,0,0),
    ROW('Supervisor', 'Orders',            1,1,1,0,0,1),
    ROW('Supervisor', 'Tables',            1,1,1,0,0,0),
    ROW('Supervisor', 'Reservation',       1,1,1,0,0,0),
    ROW('Supervisor', 'Kitchen (KDS)',     1,0,1,0,0,0),
    ROW('Supervisor', 'Invoices',          1,0,0,0,1,0),
    ROW('Supervisor', 'Payments',          1,1,0,0,0,0),
    ROW('Supervisor', 'Coupons',           1,1,1,0,0,0),
    ROW('Supervisor', 'Addons',            1,1,1,0,0,0),
    ROW('Supervisor', 'Manage Staffs',     1,0,0,0,0,0),
    ROW('Supervisor', 'Audit Logs',        1,0,0,0,0,0),

    -- =================================================================
    -- CASHIER — bán hàng tại quầy (POS / Orders / Payments / Invoices)
    -- =================================================================
    ROW('Cashier', 'Dashboard',         1,0,0,0,0,0),
    ROW('Cashier', 'POS',               1,1,1,0,0,0),
    ROW('Cashier', 'Hold/Resume Sale',  1,1,0,0,0,0),
    ROW('Cashier', 'Refund / Return',   1,0,0,0,0,0),
    ROW('Cashier', 'Products',          1,0,0,0,0,0),
    ROW('Cashier', 'Categories',        1,0,0,0,0,0),
    ROW('Cashier', 'Customers',         1,1,0,0,0,0),
    ROW('Cashier', 'Reports',           0,0,0,0,0,0),
    ROW('Cashier', 'Settings',          0,0,0,0,0,0),
    ROW('Cashier', 'Orders',            1,1,1,0,0,0),
    ROW('Cashier', 'Tables',            1,0,0,0,0,0),
    ROW('Cashier', 'Reservation',       1,1,0,0,0,0),
    ROW('Cashier', 'Kitchen (KDS)',     0,0,0,0,0,0),
    ROW('Cashier', 'Invoices',          1,1,0,0,0,0),
    ROW('Cashier', 'Payments',          1,1,0,0,0,0),
    ROW('Cashier', 'Coupons',           1,0,0,0,0,0),
    ROW('Cashier', 'Addons',            1,0,0,0,0,0),
    ROW('Cashier', 'Manage Staffs',     0,0,0,0,0,0),
    ROW('Cashier', 'Audit Logs',        0,0,0,0,0,0),

    -- =================================================================
    -- CHEF — chỉ tập trung Kitchen (KDS), xem Products/Orders để nắm món
    -- =================================================================
    ROW('Chef', 'Dashboard',         0,0,0,0,0,0),
    ROW('Chef', 'POS',               0,0,0,0,0,0),
    ROW('Chef', 'Hold/Resume Sale',  0,0,0,0,0,0),
    ROW('Chef', 'Refund / Return',   0,0,0,0,0,0),
    ROW('Chef', 'Products',          1,0,0,0,0,0),
    ROW('Chef', 'Categories',        1,0,0,0,0,0),
    ROW('Chef', 'Customers',         0,0,0,0,0,0),
    ROW('Chef', 'Reports',           0,0,0,0,0,0),
    ROW('Chef', 'Settings',          0,0,0,0,0,0),
    ROW('Chef', 'Orders',            1,0,0,0,0,0),
    ROW('Chef', 'Tables',            0,0,0,0,0,0),
    ROW('Chef', 'Reservation',       0,0,0,0,0,0),
    ROW('Chef', 'Kitchen (KDS)',     1,1,1,0,0,0),
    ROW('Chef', 'Invoices',          0,0,0,0,0,0),
    ROW('Chef', 'Payments',          0,0,0,0,0,0),
    ROW('Chef', 'Coupons',           0,0,0,0,0,0),
    ROW('Chef', 'Addons',            1,0,0,0,0,0),
    ROW('Chef', 'Manage Staffs',     0,0,0,0,0,0),
    ROW('Chef', 'Audit Logs',        0,0,0,0,0,0),

    -- =================================================================
    -- WAITER — phục vụ bàn: POS / Orders / Tables / Reservation
    -- =================================================================
    ROW('Waiter', 'Dashboard',         0,0,0,0,0,0),
    ROW('Waiter', 'POS',               1,1,0,0,0,0),
    ROW('Waiter', 'Hold/Resume Sale',  1,1,0,0,0,0),
    ROW('Waiter', 'Refund / Return',   0,0,0,0,0,0),
    ROW('Waiter', 'Products',          1,0,0,0,0,0),
    ROW('Waiter', 'Categories',        1,0,0,0,0,0),
    ROW('Waiter', 'Customers',         1,1,0,0,0,0),
    ROW('Waiter', 'Reports',           0,0,0,0,0,0),
    ROW('Waiter', 'Settings',          0,0,0,0,0,0),
    ROW('Waiter', 'Orders',            1,1,1,0,0,0),
    ROW('Waiter', 'Tables',            1,0,1,0,0,0),
    ROW('Waiter', 'Reservation',       1,1,1,0,0,0),
    ROW('Waiter', 'Kitchen (KDS)',     1,0,0,0,0,0),
    ROW('Waiter', 'Invoices',          1,0,0,0,0,0),
    ROW('Waiter', 'Payments',          1,0,0,0,0,0),
    ROW('Waiter', 'Coupons',           1,0,0,0,0,0),
    ROW('Waiter', 'Addons',            1,0,0,0,0,0),
    ROW('Waiter', 'Manage Staffs',     0,0,0,0,0,0),
    ROW('Waiter', 'Audit Logs',        0,0,0,0,0,0),

    -- =================================================================
    -- DELIVERY — giao hàng: xem Orders (giao), thu tiền COD (Payments)
    -- =================================================================
    ROW('Delivery', 'Dashboard',         0,0,0,0,0,0),
    ROW('Delivery', 'POS',               0,0,0,0,0,0),
    ROW('Delivery', 'Hold/Resume Sale',  0,0,0,0,0,0),
    ROW('Delivery', 'Refund / Return',   0,0,0,0,0,0),
    ROW('Delivery', 'Products',          1,0,0,0,0,0),
    ROW('Delivery', 'Categories',        0,0,0,0,0,0),
    ROW('Delivery', 'Customers',         1,0,0,0,0,0),
    ROW('Delivery', 'Reports',           0,0,0,0,0,0),
    ROW('Delivery', 'Settings',          0,0,0,0,0,0),
    ROW('Delivery', 'Orders',            1,0,1,0,0,0),
    ROW('Delivery', 'Tables',            0,0,0,0,0,0),
    ROW('Delivery', 'Reservation',       0,0,0,0,0,0),
    ROW('Delivery', 'Kitchen (KDS)',     0,0,0,0,0,0),
    ROW('Delivery', 'Invoices',          1,0,0,0,0,0),
    ROW('Delivery', 'Payments',          1,1,0,0,0,0),
    ROW('Delivery', 'Coupons',           0,0,0,0,0,0),
    ROW('Delivery', 'Addons',            0,0,0,0,0,0),
    ROW('Delivery', 'Manage Staffs',     0,0,0,0,0,0),
    ROW('Delivery', 'Audit Logs',        0,0,0,0,0,0),

    -- =================================================================
    -- ACCOUNTANT — sổ sách: Reports / Invoices / Payments / Refund
    -- =================================================================
    ROW('Accountant', 'Dashboard',         1,0,0,0,0,0),
    ROW('Accountant', 'POS',               0,0,0,0,0,0),
    ROW('Accountant', 'Hold/Resume Sale',  0,0,0,0,0,0),
    ROW('Accountant', 'Refund / Return',   1,0,0,0,0,1),
    ROW('Accountant', 'Products',          1,0,0,0,0,0),
    ROW('Accountant', 'Categories',        1,0,0,0,0,0),
    ROW('Accountant', 'Customers',         1,0,0,0,0,0),
    ROW('Accountant', 'Reports',           1,0,0,0,1,0),
    ROW('Accountant', 'Settings',          1,0,0,0,0,0),
    ROW('Accountant', 'Orders',            1,0,0,0,0,0),
    ROW('Accountant', 'Tables',            0,0,0,0,0,0),
    ROW('Accountant', 'Reservation',       0,0,0,0,0,0),
    ROW('Accountant', 'Kitchen (KDS)',     0,0,0,0,0,0),
    ROW('Accountant', 'Invoices',          1,1,1,0,1,0),
    ROW('Accountant', 'Payments',          1,1,1,0,1,0),
    ROW('Accountant', 'Coupons',           1,0,0,0,0,0),
    ROW('Accountant', 'Addons',            1,0,0,0,0,0),
    ROW('Accountant', 'Manage Staffs',     0,0,0,0,0,0),
    ROW('Accountant', 'Audit Logs',        1,0,0,0,0,0),

    -- =================================================================
    -- SYSTEM OPERATOR — kỹ thuật: Settings / Manage Staffs / Audit Logs
    -- =================================================================
    ROW('System Operator', 'Dashboard',         1,0,0,0,0,0),
    ROW('System Operator', 'POS',               0,0,0,0,0,0),
    ROW('System Operator', 'Hold/Resume Sale',  0,0,0,0,0,0),
    ROW('System Operator', 'Refund / Return',   0,0,0,0,0,0),
    ROW('System Operator', 'Products',          1,0,0,0,0,0),
    ROW('System Operator', 'Categories',        1,0,0,0,0,0),
    ROW('System Operator', 'Customers',         0,0,0,0,0,0),
    ROW('System Operator', 'Reports',           1,0,0,0,1,0),
    ROW('System Operator', 'Settings',          1,1,1,0,0,0),
    ROW('System Operator', 'Orders',            1,0,0,0,0,0),
    ROW('System Operator', 'Tables',            0,0,0,0,0,0),
    ROW('System Operator', 'Reservation',       0,0,0,0,0,0),
    ROW('System Operator', 'Kitchen (KDS)',     0,0,0,0,0,0),
    ROW('System Operator', 'Invoices',          0,0,0,0,0,0),
    ROW('System Operator', 'Payments',          0,0,0,0,0,0),
    ROW('System Operator', 'Coupons',           0,0,0,0,0,0),
    ROW('System Operator', 'Addons',            0,0,0,0,0,0),
    ROW('System Operator', 'Manage Staffs',     1,1,1,1,1,0),
    ROW('System Operator', 'Audit Logs',        1,1,0,0,1,0)

) AS v(role_name, module_name, can_view, can_add, can_edit, can_delete, can_export, can_approve_void)
JOIN roles r              ON r.name = v.role_name
JOIN permission_modules m ON m.name = v.module_name;
