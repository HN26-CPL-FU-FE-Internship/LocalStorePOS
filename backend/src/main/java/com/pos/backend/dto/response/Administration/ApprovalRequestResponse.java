package com.pos.backend.dto.response.Administration;

import java.time.LocalDateTime;

import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApprovalRequestResponse {
    Long id;
    ApprovalRequestType requestType;
    ApprovalStatus status;
    String description;
    String reason;
    String rejectionReason;
    String targetType;
    Long targetId;
    String targetDisplay;
    String oldValue;
    String newValue;
    String additionalData;
    LocalDateTime resolvedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Requester info
    Long requestedById;
    String requestedByName;
    String requestedByEmail;

    // Approver info (nullable)
    Long approvedById;
    String approvedByName;
    String approvedByEmail;
}
