package com.pos.backend.dto.request.Administration;

import com.pos.backend.constant.enums.ApprovalRequestType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @NotNull(message = "Request type is required")
    ApprovalRequestType requestType;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    String description;

    @NotBlank(message = "Reason is required")
    @Size(max = 2000, message = "Reason must not exceed 2000 characters")
    String reason;

    @Size(max = 100, message = "Target type must not exceed 100 characters")
    String targetType;

    Long targetId;

    @Size(max = 255, message = "Target display must not exceed 255 characters")
    String targetDisplay;

    String oldValue;

    String newValue;

    String additionalData;
}
