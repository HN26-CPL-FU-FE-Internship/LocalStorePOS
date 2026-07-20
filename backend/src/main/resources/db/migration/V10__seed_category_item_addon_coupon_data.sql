-- =====================================================================
-- V9: Seed sample data for categories, items, addons, coupons
-- =====================================================================

SET NAMES utf8mb4;

-- Categories
INSERT INTO categories (name, image_path, status)
SELECT 'Coffee & Tea', NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Coffee & Tea');

INSERT INTO categories (name, image_path, status)
SELECT 'Pizza', NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pizza');

INSERT INTO categories (name, image_path, status)
SELECT 'Dessert', NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dessert');

-- Items
INSERT INTO items (category_id, tax_id, name, description, image_path, price, net_price, food_type, stock_quantity, low_stock_threshold, status)
SELECT c.id, NULL, 'Espresso', 'Strong black coffee', NULL, 35000.00, 30000.00, 'veg', 100, 10, 'active'
FROM categories c
WHERE c.name = 'Coffee & Tea'
  AND NOT EXISTS (
      SELECT 1 FROM items i WHERE i.name = 'Espresso' AND i.category_id = c.id
  );

INSERT INTO items (category_id, tax_id, name, description, image_path, price, net_price, food_type, stock_quantity, low_stock_threshold, status)
SELECT c.id, NULL, 'Margherita Pizza', 'Classic tomato and mozzarella pizza', NULL, 120000.00, 95000.00, 'veg', 50, 5, 'active'
FROM categories c
WHERE c.name = 'Pizza'
  AND NOT EXISTS (
      SELECT 1 FROM items i WHERE i.name = 'Margherita Pizza' AND i.category_id = c.id
  );

INSERT INTO items (category_id, tax_id, name, description, image_path, price, net_price, food_type, stock_quantity, low_stock_threshold, status)
SELECT c.id, NULL, 'Chocolate Cake', 'Rich chocolate dessert', NULL, 65000.00, 50000.00, 'veg', 30, 5, 'active'
FROM categories c
WHERE c.name = 'Dessert'
  AND NOT EXISTS (
      SELECT 1 FROM items i WHERE i.name = 'Chocolate Cake' AND i.category_id = c.id
  );

-- Addons
INSERT INTO addons (item_id, name, price, description, image_path, status)
SELECT i.id, 'Extra Shot', 15000.00, 'Add one more shot of espresso', NULL, 'active'
FROM items i
WHERE i.name = 'Espresso'
  AND NOT EXISTS (
      SELECT 1 FROM addons a WHERE a.item_id = i.id AND a.name = 'Extra Shot'
  );

INSERT INTO addons (item_id, name, price, description, image_path, status)
SELECT i.id, 'Extra Cheese', 20000.00, 'More cheese on pizza', NULL, 'active'
FROM items i
WHERE i.name = 'Margherita Pizza'
  AND NOT EXISTS (
      SELECT 1 FROM addons a WHERE a.item_id = i.id AND a.name = 'Extra Cheese'
  );

-- Coupons
INSERT INTO coupons (code, discount_type, discount_amount, start_date, expiry_date, status)
SELECT 'WELCOME10', 'percentage', 10.00, '2026-07-20', '2026-12-31', 'active'
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10');

INSERT INTO coupons (code, discount_type, discount_amount, start_date, expiry_date, status)
SELECT 'SAVE20', 'fixed_amount', 20000.00, '2026-07-20', '2026-12-31', 'active'
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SAVE20');

-- Coupon categories
INSERT INTO coupon_categories (coupon_id, category_id)
SELECT c.id, cat.id
FROM coupons c
JOIN categories cat ON cat.name = 'Coffee & Tea'
WHERE c.code = 'WELCOME10'
  AND NOT EXISTS (
      SELECT 1 FROM coupon_categories cc WHERE cc.coupon_id = c.id AND cc.category_id = cat.id
  );

INSERT INTO coupon_categories (coupon_id, category_id)
SELECT c.id, cat.id
FROM coupons c
JOIN categories cat ON cat.name = 'Pizza'
WHERE c.code = 'WELCOME10'
  AND NOT EXISTS (
      SELECT 1 FROM coupon_categories cc WHERE cc.coupon_id = c.id AND cc.category_id = cat.id
  );

INSERT INTO coupon_categories (coupon_id, category_id)
SELECT c.id, cat.id
FROM coupons c
JOIN categories cat ON cat.name = 'Dessert'
WHERE c.code = 'SAVE20'
  AND NOT EXISTS (
      SELECT 1 FROM coupon_categories cc WHERE cc.coupon_id = c.id AND cc.category_id = cat.id
  );
