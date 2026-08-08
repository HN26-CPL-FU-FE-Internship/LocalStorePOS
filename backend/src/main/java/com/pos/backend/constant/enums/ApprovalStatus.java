package com.pos.backend.constant.enums;

public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    /** Approved, but the underlying business action failed to execute. */
    FAILED,
}
