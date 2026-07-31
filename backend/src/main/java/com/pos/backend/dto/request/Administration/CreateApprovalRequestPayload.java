package com.pos.backend.dto.request.Administration;

import com.pos.backend.constant.enums.ApprovalRequestType;

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
public class CreateApprovalRequestPayload {
    ApprovalRequestType requestType;
    String description;
    String reason;
    String targetType;
    Long targetId;
    String targetDisplay;
    String oldValue;
    String newValue;
    String additionalData;
}
