-- V13: Create approval_requests table for the approval workflow system
-- Hibernate is in validate mode, so this table must exist in the database.

CREATE TABLE approval_requests (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_type      VARCHAR(50)  NOT NULL COMMENT 'CANCEL_INVOICE, REFUND_RETURN, DISCOUNT_EXCEEDS_THRESHOLD, COMPLIMENTARY, REOPEN_PAID_INVOICE, CANCEL_ITEM_AFTER_KITCHEN, CANCEL_KITCHEN_TICKET, PRICE_CHANGE, PERMISSION_CHANGE, USER_CREATE_DELETE, DELETE_IMPORTANT_DATA',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED',
    requested_by_id   BIGINT UNSIGNED NOT NULL,
    approved_by_id    BIGINT UNSIGNED NULL,
    target_id         BIGINT NULL COMMENT 'ID of the target entity (order, item, user, etc.)',
    target_type       VARCHAR(100) NULL COMMENT 'Entity class name (Order, Item, User, etc.)',
    target_display    VARCHAR(255) NULL COMMENT 'Human-readable identifier (order #123, item name, etc.)',
    description       TEXT NOT NULL COMMENT 'What this approval request is about',
    reason            TEXT NOT NULL COMMENT 'Why the requester needs this approval',
    rejection_reason  TEXT NULL COMMENT 'Resolution note (approval reason or rejection reason)',
    old_value         TEXT NULL COMMENT 'Snapshot of the current value before change (JSON)',
    new_value         TEXT NULL COMMENT 'Snapshot of the proposed value after change (JSON)',
    additional_data   TEXT NULL COMMENT 'Extra metadata as JSON',
    resolved_at       DATETIME NULL COMMENT 'When the request was approved or rejected',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_requests_requested_by FOREIGN KEY (requested_by_id) REFERENCES users(id),
    CONSTRAINT fk_approval_requests_approved_by  FOREIGN KEY (approved_by_id)  REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_approval_requests_status       ON approval_requests(status);
CREATE INDEX idx_approval_requests_request_type ON approval_requests(request_type);
CREATE INDEX idx_approval_requests_requested_by ON approval_requests(requested_by_id);
CREATE INDEX idx_approval_requests_approved_by  ON approval_requests(approved_by_id);
CREATE INDEX idx_approval_requests_created_at   ON approval_requests(created_at);
