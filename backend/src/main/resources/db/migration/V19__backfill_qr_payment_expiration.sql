UPDATE payments
SET expires_at = DATE_ADD(created_at, INTERVAL 15 MINUTE)
WHERE payment_code IS NOT NULL
  AND expires_at IS NULL;
