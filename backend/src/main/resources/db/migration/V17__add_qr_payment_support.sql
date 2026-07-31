ALTER TABLE payments
    ADD COLUMN payment_code VARCHAR(50) NULL UNIQUE AFTER transaction_id;

ALTER TABLE payments
    MODIFY COLUMN paid_at DATETIME NULL;

INSERT INTO payment_methods (code, name, is_enabled)
SELECT 'qr', 'QR Payment', 1
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'qr');
