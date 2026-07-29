package com.pos.backend.dto.response.Audit;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuditLogResponse {
    Long id;
    Long userId;
    String userName;
    String userEmail;
    String action;
    String module;
    String entityType;
    Long entityId;
    String description;
    String oldValue;
    String newValue;
    String actionStatus;
    String ipAddress;
    LocalDateTime createdAt;
}
