-- V12: Add missing columns to audit_logs for the enhanced audit system
-- NOTE: audit_logs table was created in V1. This migration adds columns needed for the new audit log feature.

ALTER TABLE audit_logs
    ADD COLUMN old_value TEXT NULL AFTER ip_address,
    ADD COLUMN new_value TEXT NULL AFTER old_value,
    ADD COLUMN action_status VARCHAR(20) NULL DEFAULT 'SUCCESS' AFTER new_value,
    ADD INDEX idx_audit_logs_created_at (created_at),
    ADD INDEX idx_audit_logs_module (module),
    ADD INDEX idx_audit_logs_action (action);
