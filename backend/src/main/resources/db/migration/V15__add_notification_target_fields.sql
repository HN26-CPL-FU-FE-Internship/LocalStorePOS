-- V15: Add target_type and target_id to notifications table
-- These fields link a notification to a related entity (e.g. approval request)
-- so the frontend can perform quick actions like accept/decline directly.

ALTER TABLE notifications
    ADD COLUMN target_type VARCHAR(50) NULL COMMENT 'Entity type (APPROVAL_REQUEST, ORDER, etc.)' AFTER is_read,
    ADD COLUMN target_id   BIGINT      NULL COMMENT 'ID of the target entity'                  AFTER target_type;

CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);
