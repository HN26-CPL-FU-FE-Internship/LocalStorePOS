ALTER TABLE payments
    ADD COLUMN expires_at DATETIME NULL AFTER paid_at;

CREATE INDEX idx_payments_qr_expiration
    ON payments (order_id, status, expires_at);
