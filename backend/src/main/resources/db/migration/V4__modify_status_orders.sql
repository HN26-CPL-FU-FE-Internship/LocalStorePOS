ALTER TABLE orders MODIFY COLUMN status ENUM('pending','preparing','delivered','served','completed','cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE orders
  MODIFY kitchen_status ENUM('new_order','in_kitchen','delayed','completed','cancelled')
  NOT NULL DEFAULT 'new_order';

