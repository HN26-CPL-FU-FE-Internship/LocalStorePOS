-- =====================================================================
-- V14: SEED DASHBOARD DATA
-- Mục đích: Cung cấp dữ liệu mẫu để dashboard hiển thị số liệu thực tế.
-- Các bảng lookup (roles, permission_modules, payment_methods, taxes)
-- đã được seed ở V1.  Admin user được tạo bởi BootstrapService (id=1).
-- Tất cả INSERT dùng NOT EXISTS để đảm bảo idempotent (có thể chạy lại).
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. STORES
-- =====================================================================
INSERT INTO stores (id, name, image_path, address_line1, address_line2, city, state, country, postal_code, phone, email, currency_code, timezone)
SELECT 1, 'Golden Dragon Restaurant', '/uploads/img/store/store-01.jpg', '123 Main Street', 'Suite 101', 'New York', 'NY', 'USA', '10001', '+1-212-555-0198', 'info@goldendragon.com', 'USD', 'America/New_York'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 1);

-- =====================================================================
-- 2. CATEGORIES
-- =====================================================================
INSERT INTO categories (id, name, image_path, status)
SELECT * FROM (VALUES
    ROW(1, 'Appetizers', '/uploads/img/category/category-01.png', 'active'),
    ROW(2, 'Main Course', '/uploads/img/category/category-02.png', 'active'),
    ROW(3, 'Soups & Salads', '/uploads/img/category/category-03.png', 'active'),
    ROW(4, 'Beverages', '/uploads/img/category/category-04.png', 'active'),
    ROW(5, 'Desserts', '/uploads/img/category/category-05.png', 'active'),
    ROW(6, 'Rice & Noodles', '/uploads/img/category/category-06.png', 'active'),
    ROW(7, 'Seafood', '/uploads/img/category/category-07.png', 'active'),
    ROW(8, 'Specials', '/uploads/img/category/category-08.png', 'active')
) AS v(id, name, image_path, status)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 1);

-- =====================================================================
-- 3. ITEMS
-- =====================================================================
INSERT INTO items (id, category_id, tax_id, name, description, image_path, price, net_price, food_type, stock_quantity, low_stock_threshold, status)
SELECT * FROM (VALUES
    ROW(1, 1, 1, 'Spring Rolls', 'Crispy vegetable spring rolls served with sweet chili sauce', '/uploads/img/items/food-01.jpg', 6.99, 3.50, 'veg', 100, 10, 'active'),
    ROW(2, 1, 1, 'Chicken Wings', 'Spicy buffalo chicken wings with blue cheese dip', '/uploads/img/items/food-02.jpg', 9.99, 5.00, 'non_veg', 80, 10, 'active'),
    ROW(3, 1, 2, 'Dumplings', 'Steamed pork dumplings with soy ginger dipping sauce', '/uploads/img/items/food-03.jpg', 8.49, 4.00, 'non_veg', 60, 5, 'active'),
    ROW(4, 2, 1, 'Grilled Salmon', 'Atlantic salmon fillet with lemon butter sauce and seasonal vegetables', '/uploads/img/items/food-04.jpg', 22.99, 12.00, 'non_veg', 30, 5, 'active'),
    ROW(5, 2, 2, 'Chicken Tikka Masala', 'Tender chicken in rich tomato cream sauce with naan bread', '/uploads/img/items/food-05.jpg', 16.99, 8.00, 'non_veg', 50, 5, 'active'),
    ROW(6, 2, 1, 'Beef Steak', '8oz ribeye steak with mashed potatoes and asparagus', '/uploads/img/items/food-06.jpg', 28.99, 15.00, 'non_veg', 25, 3, 'active'),
    ROW(7, 3, 4, 'Tomato Basil Soup', 'Creamy tomato soup with fresh basil and croutons', '/uploads/img/items/food-07.jpg', 5.99, 2.50, 'veg', NULL, NULL, 'active'),
    ROW(8, 3, 4, 'Caesar Salad', 'Romaine lettuce, parmesan, croutons with caesar dressing', '/uploads/img/items/food-08.jpg', 7.99, 3.50, 'veg', NULL, NULL, 'active'),
    ROW(9, 4, NULL, 'Fresh Orange Juice', 'Freshly squeezed orange juice', '/uploads/img/items/food-09.jpg', 4.99, 1.50, 'veg', 200, 20, 'active'),
    ROW(10, 4, NULL, 'Green Tea', 'Premium Japanese green tea', '/uploads/img/items/food-10.jpg', 3.49, 0.80, 'veg', 300, 30, 'active'),
    ROW(11, 4, NULL, 'Espresso', 'Double shot espresso', '/uploads/img/items/food-11.jpg', 3.99, 1.00, 'veg', 500, 50, 'active'),
    ROW(12, 5, 5, 'Chocolate Lava Cake', 'Warm chocolate cake with molten center and vanilla ice cream', '/uploads/img/items/food-12.jpg', 8.99, 4.00, 'egg', 40, 5, 'active'),
    ROW(13, 5, 5, 'Tiramisu', 'Classic Italian tiramisu with mascarpone cheese', '/uploads/img/items/food-13.jpg', 7.99, 3.50, 'egg', 30, 5, 'active'),
    ROW(14, 5, 5, 'Ice Cream Trio', 'Three scoops of vanilla, chocolate, and strawberry ice cream', '/uploads/img/items/food-14.jpg', 6.49, 2.00, 'veg', 100, 10, 'active'),
    ROW(15, 6, 1, 'Fried Rice', 'Vegetable fried rice with eggs and soy sauce', '/uploads/img/items/food-15.jpg', 11.99, 5.50, 'egg', NULL, NULL, 'active'),
    ROW(16, 6, 2, 'Pad Thai', 'Thai rice noodles with shrimp, peanuts, and lime', '/uploads/img/items/food-16.jpg', 13.99, 6.50, 'non_veg', NULL, NULL, 'active'),
    ROW(17, 7, 1, 'Garlic Butter Shrimp', 'Jumbo shrimp sauteed in garlic butter sauce', '/uploads/img/items/food-17.jpg', 18.99, 9.50, 'non_veg', 40, 5, 'active'),
    ROW(18, 7, 2, 'Lobster Tail', 'Grilled lobster tail with drawn butter', '/uploads/img/items/food-18.jpg', 32.99, 18.00, 'non_veg', 15, 3, 'active'),
    ROW(19, 8, NULL, 'Chef Special Platter', 'Chef selection of 3 appetizers with dipping sauces', '/uploads/img/items/food-19.jpg', 15.99, 7.00, 'veg', NULL, NULL, 'active'),
    ROW(20, 8, 1, 'Sunday Roast', 'Roasted chicken with stuffing, roast potatoes, and gravy', '/uploads/img/items/food-20.jpg', 19.99, 10.00, 'non_veg', 20, 5, 'hidden')
) AS v(id, category_id, tax_id, name, description, image_path, price, net_price, food_type, stock_quantity, low_stock_threshold, status)
WHERE NOT EXISTS (SELECT 1 FROM items WHERE id = 1);

-- =====================================================================
-- 4. TABLE AREAS
-- =====================================================================
INSERT INTO table_areas (id, name)
SELECT * FROM (VALUES
    ROW(1, 'Main Hall'), ROW(2, 'VIP Room'), ROW(3, 'Rooftop'),
    ROW(4, 'Outdoor Patio'), ROW(5, 'Private Dining')
) AS v(id, name)
WHERE NOT EXISTS (SELECT 1 FROM table_areas WHERE id = 1);

-- =====================================================================
-- 5. RESTAURANT TABLES
-- =====================================================================
INSERT INTO restaurant_tables (id, area_id, table_number, seats, status)
SELECT * FROM (VALUES
    ROW(1, 1, 'T1', 4, 'available'), ROW(2, 1, 'T2', 4, 'occupied'), ROW(3, 1, 'T3', 2, 'available'),
    ROW(4, 1, 'T4', 6, 'available'), ROW(5, 1, 'T5', 4, 'occupied'), ROW(6, 2, 'VIP1', 8, 'available'),
    ROW(7, 2, 'VIP2', 6, 'available'), ROW(8, 3, 'R1', 4, 'available'), ROW(9, 3, 'R2', 2, 'occupied'),
    ROW(10, 4, 'O1', 4, 'available'), ROW(11, 4, 'O2', 6, 'available'), ROW(12, 5, 'P1', 10, 'available'),
    ROW(13, 1, 'T6', 2, 'available'), ROW(14, 1, 'T7', 4, 'available'), ROW(15, 3, 'R3', 4, 'occupied')
) AS v(id, area_id, table_number, seats, status)
WHERE NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE id = 1);

-- =====================================================================
-- 6. ADDITIONAL USERS (admin id=1 created by BootstrapService)
-- =====================================================================
INSERT INTO users (id, role_id, first_name, last_name, email, phone_number, password_hash, avatar_path, status, email_verified_at, last_login_at, created_at)
SELECT * FROM (VALUES
    ROW(2, 3, 'Sarah', 'Johnson', 'sarah@goldendragon.com', '+1-212-555-0002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '/uploads/img/profiles/avatar-05.jpg', 'active', '2026-01-05 09:00:00', '2026-07-13 17:00:00', '2026-01-05 09:00:00'),
    ROW(3, 4, 'Mike', 'Chen', 'mike@goldendragon.com', '+1-212-555-0003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '/uploads/img/profiles/avatar-09.jpg', 'active', '2026-01-10 09:00:00', '2026-07-13 07:00:00', '2026-01-10 09:00:00'),
    ROW(4, 5, 'Emily', 'Davis', 'emily@goldendragon.com', '+1-212-555-0004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '/uploads/img/users/user-01.jpg', 'active', '2026-02-01 09:00:00', '2026-07-13 08:00:00', '2026-02-01 09:00:00'),
    ROW(5, 2, 'David', 'Brown', 'david@goldendragon.com', '+1-212-555-0005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '/uploads/img/users/user-02.jpg', 'active', '2026-01-15 09:00:00', '2026-07-12 09:00:00', '2026-01-15 09:00:00'),
    ROW(6, 6, 'Lisa', 'Wilson', 'lisa@goldendragon.com', '+1-212-555-0006', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '/uploads/img/users/user-03.jpg', 'active', '2026-03-01 09:00:00', '2026-07-10 10:00:00', '2026-03-01 09:00:00')
) AS v(id, role_id, first_name, last_name, email, phone_number, password_hash, avatar_path, status, email_verified_at, last_login_at, created_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);

-- =====================================================================
-- 7. CUSTOMERS
-- =====================================================================
INSERT INTO customers (id, name, phone, email, avatar_path, date_of_birth, gender, status, is_walkin, created_at)
SELECT * FROM (VALUES
    ROW(1, 'Alice Johnson', '+1-212-555-0101', 'alice.j@email.com', '/uploads/img/users/user-05.jpg', '1990-05-15', 'female', 'active', 0, '2026-06-01 10:00:00'),
    ROW(2, 'Bob Williams', '+1-212-555-0102', 'bob.w@email.com', NULL, '1985-08-22', 'male', 'active', 0, '2026-06-05 10:00:00'),
    ROW(3, 'Charlie Brown', '+1-212-555-0103', 'charlie.b@email.com', NULL, '1995-12-10', 'male', 'active', 0, '2026-06-10 10:00:00'),
    ROW(4, 'Diana Martinez', '+1-212-555-0104', 'diana.m@email.com', NULL, '2000-03-30', 'female', 'active', 0, '2026-06-15 10:00:00'),
    ROW(5, 'Edward Lee', '+1-212-555-0105', 'edward.l@email.com', '/uploads/img/users/user-06.jpg', '1988-07-18', 'male', 'active', 0, '2026-06-20 10:00:00'),
    ROW(6, 'Walk-in Customer', '+1-212-555-0199', NULL, NULL, NULL, NULL, 'active', 1, '2026-07-01 10:00:00')
) AS v(id, name, phone, email, avatar_path, date_of_birth, gender, status, is_walkin, created_at)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE id = 1);

-- =====================================================================
-- 8. COUPONS
-- =====================================================================
INSERT INTO coupons (id, code, discount_type, discount_amount, start_date, expiry_date, status)
SELECT * FROM (VALUES
    ROW(1, 'WELCOME10', 'percentage', 10.00, '2026-01-01', '2026-12-31', 'active'),
    ROW(2, 'FLAT5OFF', 'fixed_amount', 5.00, '2026-06-01', '2026-09-30', 'active'),
    ROW(3, 'SAVE15', 'percentage', 15.00, '2026-07-01', '2026-08-31', 'active')
) AS v(id, code, discount_type, discount_amount, start_date, expiry_date, status)
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE id = 1);

-- =====================================================================
-- 9. RESERVATIONS
-- =====================================================================
INSERT INTO reservations (id, customer_id, table_id, reservation_time, guests, status, notes, created_by, created_at)
SELECT * FROM (VALUES
    ROW(1, 1, 12, DATE_ADD(NOW(), INTERVAL 2 DAY), 8, 'booked', 'Birthday celebration - need cake service', 1, NOW()),
    ROW(2, 2, 4, DATE_ADD(NOW(), INTERVAL 3 DAY), 5, 'booked', 'Business dinner', 4, NOW()),
    ROW(3, 3, 8, DATE_ADD(NOW(), INTERVAL 5 DAY), 3, 'booked', NULL, 4, NOW()),
    ROW(4, 4, 10, DATE_ADD(NOW(), INTERVAL 7 DAY), 4, 'booked', 'Anniversary dinner', 4, NOW()),
    ROW(5, 5, 6, DATE_ADD(NOW(), INTERVAL 10 DAY), 6, 'booked', NULL, 4, NOW())
) AS v(id, customer_id, table_id, reservation_time, guests, status, notes, created_by, created_at)
WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE id = 1);

-- =====================================================================
-- 10. ORDERS — Completed/paid orders spread across last 4 weeks
--     for revenue chart, top items, category stats, sales performance.
--     Also includes some active (non-completed) orders for active orders card.
-- =====================================================================
INSERT INTO orders (id, order_number, token_no, order_type, customer_id, table_id, waiter_id, coupon_id, status, kitchen_status, subtotal, discount_amount, tax_amount, service_charge, delivery_charge, tip_amount, grand_total, paid_amount, balance_amount, payment_status, note, ordered_at)
SELECT * FROM (VALUES
    -- Completed & paid orders (appear in revenue chart, stats)
    ROW(1, '#10001', 'A01', 'dine_in', 1, 1, 4, NULL, 'completed', 'completed', 48.45, 0.00, 4.36, 0.00, 0.00, 5.00, 57.81, 60.00, 2.19, 'paid', 'No onions', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(2, '#10002', 'A02', 'dine_in', 6, 3, 4, NULL, 'completed', 'completed', 37.95, 0.00, 3.42, 0.00, 0.00, 3.00, 44.37, 45.00, 0.63, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(3, '#10003', 'B01', 'take_away', 2, NULL, 5, 1, 'completed', 'completed', 60.94, 6.09, 4.94, 0.00, 0.00, 0.00, 59.79, 59.79, 0.00, 'paid', 'Extra spicy', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ROW(4, '#10004', 'B02', 'delivery', 3, NULL, NULL, NULL, 'completed', 'completed', 34.47, 0.00, 3.10, 0.00, 5.00, 0.00, 42.57, 42.57, 0.00, 'paid', 'Leave at door', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ROW(5, '#10005', 'A03', 'dine_in', 6, 5, 4, NULL, 'completed', 'completed', 80.46, 0.00, 7.24, 0.00, 0.00, 10.00, 97.70, 100.00, 2.30, 'paid', 'Birthday celebration', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    ROW(6, '#10006', 'B03', 'take_away', 4, NULL, NULL, NULL, 'completed', 'completed', 19.47, 0.00, 1.75, 0.00, 0.00, 0.00, 21.22, 22.00, 0.78, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
    ROW(7, '#10007', 'A04', 'dine_in', 1, 2, 4, NULL, 'completed', 'completed', 47.46, 5.00, 3.82, 0.00, 0.00, 8.00, 54.28, 55.00, 0.72, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
    ROW(8, '#10008', NULL, 'delivery', 5, NULL, NULL, 2, 'completed', 'completed', 35.47, 5.00, 3.19, 0.00, 5.00, 0.00, 38.66, 40.00, 1.34, 'paid', 'Call before delivery', DATE_SUB(NOW(), INTERVAL 7 DAY)),
    ROW(9, '#10009', 'A05', 'dine_in', 6, 9, 5, NULL, 'completed', 'completed', 65.95, 0.00, 5.94, 0.00, 0.00, 6.00, 77.89, 80.00, 2.11, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 8 DAY)),
    ROW(10, '#10010', 'B04', 'take_away', 2, NULL, NULL, 3, 'completed', 'completed', 42.98, 6.45, 3.87, 0.00, 0.00, 0.00, 40.40, 40.40, 0.00, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
    ROW(11, '#10011', NULL, 'delivery', 3, NULL, NULL, NULL, 'completed', 'completed', 28.99, 0.00, 2.61, 0.00, 5.00, 0.00, 36.60, 37.00, 0.40, 'paid', 'Ring bell', DATE_SUB(NOW(), INTERVAL 12 DAY)),
    ROW(12, '#10012', 'A06', 'dine_in', 5, 6, 4, NULL, 'completed', 'completed', 73.47, 0.00, 6.61, 0.00, 0.00, 12.00, 92.08, 95.00, 2.92, 'paid', 'Anniversary dinner', DATE_SUB(NOW(), INTERVAL 14 DAY)),
    ROW(13, '#10013', 'B05', 'take_away', 4, NULL, NULL, NULL, 'completed', 'completed', 22.97, 0.00, 2.07, 0.00, 0.00, 0.00, 25.04, 25.04, 0.00, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 16 DAY)),
    ROW(14, '#10014', 'A07', 'dine_in', 1, 13, 5, NULL, 'completed', 'completed', 55.96, 0.00, 5.04, 0.00, 0.00, 7.00, 68.00, 70.00, 2.00, 'paid', 'Extra napkins', DATE_SUB(NOW(), INTERVAL 18 DAY)),
    ROW(15, '#10015', NULL, 'delivery', 5, NULL, NULL, 1, 'completed', 'completed', 31.48, 3.15, 2.83, 0.00, 5.00, 0.00, 36.16, 36.16, 0.00, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 21 DAY)),
    ROW(16, '#10016', 'B06', 'take_away', 2, NULL, NULL, NULL, 'completed', 'completed', 18.98, 0.00, 1.71, 0.00, 0.00, 0.00, 20.69, 21.00, 0.31, 'paid', 'No ice', DATE_SUB(NOW(), INTERVAL 25 DAY)),
    ROW(17, '#10017', 'A08', 'dine_in', 6, 1, 4, NULL, 'completed', 'completed', 52.47, 0.00, 4.72, 0.00, 0.00, 5.00, 62.19, 65.00, 2.81, 'paid', NULL, DATE_SUB(NOW(), INTERVAL 28 DAY)),

    -- Active orders (non-completed, for active orders card)
    ROW(18, '#10018', 'A09', 'dine_in', 6, 2, 4, NULL, 'preparing', 'in_kitchen', 35.97, 0.00, 3.24, 0.00, 0.00, 0.00, 39.21, 0.00, 0.00, 'unpaid', 'Make it spicy', NOW()),
    ROW(19, '#10019', 'B07', 'take_away', 3, NULL, NULL, NULL, 'pending', 'new_order', 24.97, 0.00, 2.25, 0.00, 0.00, 0.00, 27.22, 27.22, 0.00, 'paid', NULL, NOW()),
    ROW(20, '#10020', 'A10', 'dine_in', 1, 3, 4, NULL, 'preparing', 'in_kitchen', 42.97, 0.00, 3.87, 0.00, 0.00, 0.00, 46.84, 0.00, 0.00, 'unpaid', 'Well done steak', NOW()),
    ROW(21, '#10021', NULL, 'delivery', 5, NULL, NULL, NULL, 'pending', 'new_order', 29.98, 0.00, 2.70, 0.00, 5.00, 0.00, 37.68, 0.00, 0.00, 'unpaid', 'Call when out for delivery', NOW())
) AS v(id, order_number, token_no, order_type, customer_id, table_id, waiter_id, coupon_id, status, kitchen_status, subtotal, discount_amount, tax_amount, service_charge, delivery_charge, tip_amount, grand_total, paid_amount, balance_amount, payment_status, note, ordered_at)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 1);

-- =====================================================================
-- 11. ITEM VARIATIONS (must exist before order_items FK references)
-- =====================================================================
INSERT INTO item_variations (id, item_id, size_name, price)
SELECT * FROM (VALUES
    ROW(1, 4, 'Regular (6oz)', 22.99),
    ROW(2, 4, 'Large (8oz)', 26.99),
    ROW(3, 6, 'Medium (8oz)', 28.99),
    ROW(4, 6, 'Large (12oz)', 34.99),
    ROW(5, 15, 'Small', 8.99),
    ROW(6, 15, 'Regular', 11.99),
    ROW(7, 15, 'Large', 14.99),
    ROW(8, 16, 'Small', 10.99),
    ROW(9, 16, 'Regular', 13.99),
    ROW(10, 16, 'Large', 16.99)
) AS v(id, item_id, size_name, price)
WHERE NOT EXISTS (SELECT 1 FROM item_variations WHERE id = 1);

-- =====================================================================
-- 12. ORDER ITEMS
-- =====================================================================
INSERT INTO order_items (id, order_id, item_id, variation_id, item_name, unit_price, quantity, line_total, kitchen_note, status)
SELECT * FROM (VALUES
    ROW(1, 1, 1, NULL, 'Spring Rolls', 6.99, 2, 13.98, NULL, 'served'),
    ROW(2, 1, 5, NULL, 'Chicken Tikka Masala', 16.99, 1, 16.99, 'Medium spicy', 'served'),
    ROW(3, 1, 15, 6, 'Fried Rice', 11.99, 1, 11.99, NULL, 'served'),
    ROW(4, 1, 11, NULL, 'Espresso', 3.99, 1, 3.99, NULL, 'served'),
    ROW(5, 1, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(6, 2, 2, NULL, 'Chicken Wings', 9.99, 2, 19.98, NULL, 'served'),
    ROW(7, 2, 7, NULL, 'Tomato Basil Soup', 5.99, 1, 5.99, NULL, 'served'),
    ROW(8, 2, 11, NULL, 'Espresso', 3.99, 1, 3.99, NULL, 'served'),
    ROW(9, 2, 13, NULL, 'Tiramisu', 7.99, 1, 7.99, NULL, 'served'),
    ROW(10, 3, 4, 1, 'Grilled Salmon', 22.99, 1, 22.99, 'Well done', 'served'),
    ROW(11, 3, 15, 7, 'Fried Rice', 14.99, 1, 14.99, NULL, 'served'),
    ROW(12, 3, 12, NULL, 'Chocolate Lava Cake', 8.99, 1, 8.99, NULL, 'served'),
    ROW(13, 3, 2, NULL, 'Chicken Wings', 9.99, 1, 9.99, NULL, 'served'),
    ROW(14, 3, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(15, 4, 5, NULL, 'Chicken Tikka Masala', 16.99, 1, 16.99, NULL, 'served'),
    ROW(16, 4, 16, 9, 'Pad Thai', 13.99, 1, 13.99, NULL, 'served'),
    ROW(17, 4, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(18, 5, 4, 2, 'Grilled Salmon', 26.99, 1, 26.99, NULL, 'served'),
    ROW(19, 5, 6, 3, 'Beef Steak', 28.99, 1, 28.99, NULL, 'served'),
    ROW(20, 5, 17, NULL, 'Garlic Butter Shrimp', 18.99, 1, 18.99, NULL, 'served'),
    ROW(21, 5, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(22, 5, 9, NULL, 'Fresh Orange Juice', 4.99, 1, 4.99, NULL, 'served'),
    ROW(23, 6, 1, NULL, 'Spring Rolls', 6.99, 1, 6.99, NULL, 'served'),
    ROW(24, 6, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(25, 6, 15, 5, 'Fried Rice', 8.99, 1, 8.99, NULL, 'served'),
    ROW(26, 7, 6, 3, 'Beef Steak', 28.99, 1, 28.99, 'Medium rare', 'served'),
    ROW(27, 7, 7, NULL, 'Tomato Basil Soup', 5.99, 1, 5.99, NULL, 'served'),
    ROW(28, 7, 11, NULL, 'Espresso', 3.99, 1, 3.99, NULL, 'served'),
    ROW(29, 7, 14, NULL, 'Ice Cream Trio', 6.49, 1, 6.49, NULL, 'served'),
    ROW(30, 8, 4, 1, 'Grilled Salmon', 22.99, 1, 22.99, 'Extra lemon', 'served'),
    ROW(31, 8, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(32, 8, 12, NULL, 'Chocolate Lava Cake', 8.99, 1, 8.99, NULL, 'served'),
    ROW(33, 9, 5, NULL, 'Chicken Tikka Masala', 16.99, 2, 33.98, NULL, 'served'),
    ROW(34, 9, 16, 9, 'Pad Thai', 13.99, 1, 13.99, NULL, 'served'),
    ROW(35, 9, 13, NULL, 'Tiramisu', 7.99, 1, 7.99, NULL, 'served'),
    ROW(36, 9, 10, NULL, 'Green Tea', 3.49, 2, 6.99, NULL, 'served'),
    ROW(37, 10, 1, NULL, 'Spring Rolls', 6.99, 2, 13.98, NULL, 'served'),
    ROW(38, 10, 5, NULL, 'Chicken Tikka Masala', 16.99, 1, 16.99, NULL, 'served'),
    ROW(39, 10, 11, NULL, 'Espresso', 3.99, 2, 7.98, NULL, 'served'),
    ROW(40, 10, 14, NULL, 'Ice Cream Trio', 6.49, 1, 6.49, NULL, 'served'),
    ROW(41, 11, 6, 3, 'Beef Steak', 28.99, 1, 28.99, NULL, 'served'),
    ROW(42, 12, 4, 2, 'Grilled Salmon', 26.99, 1, 26.99, NULL, 'served'),
    ROW(43, 12, 17, NULL, 'Garlic Butter Shrimp', 18.99, 1, 18.99, NULL, 'served'),
    ROW(44, 12, 7, NULL, 'Tomato Basil Soup', 5.99, 2, 11.98, NULL, 'served'),
    ROW(45, 12, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(46, 12, 13, NULL, 'Tiramisu', 7.99, 1, 7.99, NULL, 'served'),
    ROW(47, 13, 2, NULL, 'Chicken Wings', 9.99, 1, 9.99, NULL, 'served'),
    ROW(48, 13, 7, NULL, 'Tomato Basil Soup', 5.99, 1, 5.99, NULL, 'served'),
    ROW(49, 13, 10, NULL, 'Green Tea', 3.49, 2, 6.98, NULL, 'served'),
    ROW(50, 14, 5, NULL, 'Chicken Tikka Masala', 16.99, 1, 16.99, NULL, 'served'),
    ROW(51, 14, 15, 6, 'Fried Rice', 11.99, 1, 11.99, NULL, 'served'),
    ROW(52, 14, 17, NULL, 'Garlic Butter Shrimp', 18.99, 1, 18.99, NULL, 'served'),
    ROW(53, 14, 14, NULL, 'Ice Cream Trio', 6.49, 1, 6.49, NULL, 'served'),
    ROW(54, 15, 16, 9, 'Pad Thai', 13.99, 1, 13.99, NULL, 'served'),
    ROW(55, 15, 7, NULL, 'Tomato Basil Soup', 5.99, 1, 5.99, NULL, 'served'),
    ROW(56, 15, 9, NULL, 'Fresh Orange Juice', 4.99, 1, 4.99, NULL, 'served'),
    ROW(57, 15, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(58, 16, 1, NULL, 'Spring Rolls', 6.99, 1, 6.99, NULL, 'served'),
    ROW(59, 16, 11, NULL, 'Espresso', 3.99, 2, 7.98, NULL, 'served'),
    ROW(60, 16, 14, NULL, 'Ice Cream Trio', 6.49, 1, 6.49, NULL, 'served'),
    ROW(61, 17, 4, 1, 'Grilled Salmon', 22.99, 1, 22.99, NULL, 'served'),
    ROW(62, 17, 2, NULL, 'Chicken Wings', 9.99, 2, 19.98, NULL, 'served'),
    ROW(63, 17, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'served'),
    ROW(64, 17, 15, 5, 'Fried Rice', 8.99, 1, 8.99, NULL, 'served'),
    ROW(65, 18, 4, 1, 'Grilled Salmon', 22.99, 1, 22.99, 'Medium rare', 'preparing'),
    ROW(66, 18, 11, NULL, 'Espresso', 3.99, 2, 7.98, NULL, 'pending'),
    ROW(67, 19, 1, NULL, 'Spring Rolls', 6.99, 1, 6.99, NULL, 'pending'),
    ROW(68, 19, 5, NULL, 'Chicken Tikka Masala', 16.99, 1, 16.99, NULL, 'pending'),
    ROW(69, 20, 6, 3, 'Beef Steak', 28.99, 1, 28.99, 'Medium well', 'preparing'),
    ROW(70, 20, 7, NULL, 'Tomato Basil Soup', 5.99, 1, 5.99, NULL, 'pending'),
    ROW(71, 20, 10, NULL, 'Green Tea', 3.49, 1, 3.49, NULL, 'pending'),
    ROW(72, 21, 16, 9, 'Pad Thai', 13.99, 1, 13.99, NULL, 'pending'),
    ROW(73, 21, 9, NULL, 'Fresh Orange Juice', 4.99, 1, 4.99, NULL, 'pending')
) AS v(id, order_id, item_id, variation_id, item_name, unit_price, quantity, line_total, kitchen_note, status)
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 1);

-- =====================================================================
-- 12. ADDONS
-- =====================================================================
INSERT INTO addons (id, item_id, name, price, description, image_path, status)
SELECT * FROM (VALUES
    ROW(1, 1, 'Extra Sweet Chili Sauce', 0.50, 'Additional dipping sauce', NULL, 'active'),
    ROW(2, 2, 'Extra Blue Cheese Dip', 1.00, 'Extra blue cheese dipping sauce', NULL, 'active'),
    ROW(3, 4, 'Extra Lemon Butter Sauce', 1.50, 'Additional lemon butter sauce', NULL, 'active'),
    ROW(4, 5, 'Extra Naan Bread', 2.00, 'One extra piece of naan bread', NULL, 'active'),
    ROW(5, 6, 'Extra Mushroom Sauce', 2.00, 'Creamy mushroom sauce topping', NULL, 'active'),
    ROW(6, 8, 'Add Grilled Chicken', 4.99, 'Grilled chicken breast on salad', NULL, 'active'),
    ROW(7, 8, 'Add Shrimp', 5.99, 'Grilled shrimp on salad', NULL, 'active'),
    ROW(8, 12, 'Extra Ice Cream Scoop', 1.50, 'Additional scoop of vanilla ice cream', NULL, 'active'),
    ROW(9, 15, 'Add Egg', 1.50, 'Add fried egg on top', NULL, 'active'),
    ROW(10, 15, 'Add Chicken', 3.99, 'Add grilled chicken pieces', NULL, 'active'),
    ROW(11, 17, 'Extra Garlic Butter', 1.00, 'Additional garlic butter sauce', NULL, 'active')
) AS v(id, item_id, name, price, description, image_path, status)
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE id = 1);

-- =====================================================================
-- 13. ORDER ITEM ADDONS
-- =====================================================================
INSERT INTO order_item_addons (id, order_item_id, addon_id, addon_name, addon_price, quantity)
SELECT * FROM (VALUES
    ROW(1, 2, 4, 'Extra Naan Bread', 2.00, 1),
    ROW(2, 10, 3, 'Extra Lemon Butter Sauce', 1.50, 1),
    ROW(3, 11, 9, 'Add Egg', 1.50, 1),
    ROW(4, 19, 5, 'Extra Mushroom Sauce', 2.00, 1),
    ROW(5, 22, 8, 'Extra Ice Cream Scoop', 1.50, 1),
    ROW(6, 33, 4, 'Extra Naan Bread', 2.00, 2),
    ROW(7, 42, 3, 'Extra Lemon Butter Sauce', 1.50, 1),
    ROW(8, 61, 3, 'Extra Lemon Butter Sauce', 1.50, 1),
    ROW(9, 62, 2, 'Extra Blue Cheese Dip', 1.00, 1)
) AS v(id, order_item_id, addon_id, addon_name, addon_price, quantity)
WHERE NOT EXISTS (SELECT 1 FROM order_item_addons WHERE id = 1);

-- =====================================================================
-- 14. PAYMENTS
-- =====================================================================
INSERT INTO payments (id, transaction_id, order_id, payment_method_id, amount, status, paid_at)
SELECT * FROM (VALUES
    ROW(1, '#TXN10001', 1, 1, 60.00, 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(2, '#TXN10002', 2, 2, 45.00, 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(3, '#TXN10003', 3, 3, 59.79, 'success', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ROW(4, '#TXN10004', 4, 1, 42.57, 'success', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ROW(5, '#TXN10005', 5, 2, 100.00, 'success', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    ROW(6, '#TXN10006', 6, 1, 22.00, 'success', DATE_SUB(NOW(), INTERVAL 4 DAY)),
    ROW(7, '#TXN10007', 7, 1, 55.00, 'success', DATE_SUB(NOW(), INTERVAL 5 DAY)),
    ROW(8, '#TXN10008', 8, 3, 40.00, 'success', DATE_SUB(NOW(), INTERVAL 7 DAY)),
    ROW(9, '#TXN10009', 9, 2, 80.00, 'success', DATE_SUB(NOW(), INTERVAL 8 DAY)),
    ROW(10, '#TXN10010', 10, 1, 40.40, 'success', DATE_SUB(NOW(), INTERVAL 10 DAY)),
    ROW(11, '#TXN10011', 11, 1, 37.00, 'success', DATE_SUB(NOW(), INTERVAL 12 DAY)),
    ROW(12, '#TXN10012', 12, 2, 95.00, 'success', DATE_SUB(NOW(), INTERVAL 14 DAY)),
    ROW(13, '#TXN10013', 13, 3, 25.04, 'success', DATE_SUB(NOW(), INTERVAL 16 DAY)),
    ROW(14, '#TXN10014', 14, 1, 70.00, 'success', DATE_SUB(NOW(), INTERVAL 18 DAY)),
    ROW(15, '#TXN10015', 15, 1, 36.16, 'success', DATE_SUB(NOW(), INTERVAL 21 DAY)),
    ROW(16, '#TXN10016', 16, 2, 21.00, 'success', DATE_SUB(NOW(), INTERVAL 25 DAY)),
    ROW(17, '#TXN10017', 17, 1, 65.00, 'success', DATE_SUB(NOW(), INTERVAL 28 DAY))
) AS v(id, transaction_id, order_id, payment_method_id, amount, status, paid_at)
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 1);

-- =====================================================================
-- 15. AUDIT LOGS (for activity notifications on dashboard)
-- =====================================================================
INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, description, created_at)
SELECT * FROM (VALUES
    ROW(4, 'created', 'ORDER', 'Order', 18, 'New order created - Table #2 (2 items)', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    ROW(4, 'created', 'ORDER', 'Order', 20, 'New order created - Table #3 (3 items)', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
    ROW(3, 'updated', 'KITCHEN', 'OrderItem', 65, 'Started cooking - Grilled Salmon for Order #10018', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    ROW(4, 'created', 'ORDER', 'Order', 21, 'New delivery order created - Order #10021', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ROW(1, 'payment', 'PAYMENT', 'Order', 19, 'Payment received - $27.22 via Cash for Order #10019', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    ROW(3, 'completed', 'KITCHEN', 'OrderItem', 18, 'Order item completed - Grilled Salmon for Order #10005', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    ROW(4, 'created', 'RESERVATION', 'Reservation', 1, 'New reservation by Alice Johnson - 8 guests, Private Dining', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
    ROW(4, 'created', 'RESERVATION', 'Reservation', 2, 'New reservation by Bob Williams - 5 guests, Table T4', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
    ROW(5, 'created', 'CUSTOMER', 'Customer', 6, 'New customer registered - Walk-in Customer', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(1, 'login', 'SYSTEM', 'User', 1, 'Admin user logged in', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(4, 'updated', 'ORDER', 'Order', 1, 'Order #10001 marked as completed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(4, 'updated', 'ORDER', 'Order', 2, 'Order #10002 marked as completed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ROW(3, 'completed', 'KITCHEN', 'OrderItem', 10, 'Order item completed - Grilled Salmon for Order #10003', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ROW(4, 'updated', 'ORDER', 'Order', 5, 'Order #10005 marked as completed - Total: $97.70', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    ROW(1, 'created', 'COUPON', 'Coupon', 3, 'New coupon created - SAVE15 (15% off)', DATE_SUB(NOW(), INTERVAL 4 DAY)),
    ROW(4, 'updated', 'ORDER', 'Order', 7, 'Payment received - $55.00 for Order #10007', DATE_SUB(NOW(), INTERVAL 5 DAY)),
    ROW(5, 'updated', 'INVENTORY', 'Item', 4, 'Stock updated - Grilled Salmon (25 units remaining)', DATE_SUB(NOW(), INTERVAL 6 DAY)),
    ROW(4, 'updated', 'ORDER', 'Order', 9, 'Order #10009 marked as completed - Total: $77.89', DATE_SUB(NOW(), INTERVAL 8 DAY)),
    ROW(5, 'updated', 'INVENTORY', 'Item', 2, 'Low stock alert - Chicken Wings (10 units left)', DATE_SUB(NOW(), INTERVAL 7 DAY))
) AS v(user_id, action, module, entity_type, entity_id, description, created_at)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE id = 1);

-- =====================================================================
-- 16. ORDER SEQUENCES
-- =====================================================================
INSERT INTO order_sequences (sequence_date, last_number)
SELECT CURDATE(), 21
WHERE NOT EXISTS (SELECT 1 FROM order_sequences WHERE sequence_date = CURDATE());

-- =====================================================================
-- 17. DELIVERY SETTINGS & PRINT SETTINGS
-- =====================================================================
INSERT INTO delivery_settings (id, store_id, delivery_charge_type, fixed_charge, charge_per_km, min_distance_for_free_km, max_delivery_distance_km)
SELECT 1, 1, 'km_based', NULL, 2.50, 3.00, 15.00
WHERE NOT EXISTS (SELECT 1 FROM delivery_settings WHERE id = 1);

INSERT INTO print_settings (id, store_id, enable_print, show_store_details, show_customer_details, page_size, header_text, footer_text)
SELECT 1, 1, 1, 1, 1, 'A4', 'Thank you for dining at Golden Dragon!', 'Visit us again!'
WHERE NOT EXISTS (SELECT 1 FROM print_settings WHERE id = 1);

SET FOREIGN_KEY_CHECKS = 1;
