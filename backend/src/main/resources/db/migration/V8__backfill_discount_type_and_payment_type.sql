-- Backfill discount_type and payment_type for existing orders
-- that were created before V7 added these columns.

-- 1. Backfill discount_type for orders with a discount applied.
--    Default to 'percentage' since the old system didn't store the type.
UPDATE orders
SET discount_type = 'percentage'
WHERE discount_amount > 0
  AND discount_type IS NULL;

-- 2. Backfill payment_type from the payments table where possible.
--    For paid orders that have exactly one payment record, use that method's code.
UPDATE orders o
JOIN (
    SELECT p.order_id, pm.code AS method_code
    FROM payments p
    JOIN payment_methods pm ON pm.id = p.payment_method_id
    WHERE p.order_id IN (
        SELECT order_id
        FROM payments
        GROUP BY order_id
        HAVING COUNT(*) = 1
    )
) single_payment ON single_payment.order_id = o.id
SET o.payment_type = single_payment.method_code
WHERE o.payment_type IS NULL;
