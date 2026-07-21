-- Add discount_type and payment_type columns to orders table

ALTER TABLE orders
    ADD COLUMN discount_type ENUM('percentage','fixed_amount') NULL AFTER discount_amount,
    ADD COLUMN payment_type VARCHAR(20) NULL AFTER balance_amount;
