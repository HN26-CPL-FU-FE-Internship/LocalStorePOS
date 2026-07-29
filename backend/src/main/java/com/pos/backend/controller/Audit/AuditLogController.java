package com.pos.backend.controller.Audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Audit.AuditLogResponse;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.service.Common.PageResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Reports', 'view')")
    public ApiResponse<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        PageResponse<AuditLogResponse> result = auditLogService.getAuditLogs(
                module, action, status, search, from, to, page, size);

        return ApiResponse.<PageResponse<AuditLogResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/modules")
    @PreAuthorize("@perm.hasPermission(authentication, 'Reports', 'view')")
    public ApiResponse<java.util.List<String>> getModules(Authentication authentication) {
        return ApiResponse.<java.util.List<String>>builder()
                .result(auditLogService.getAvailableModules())
                .build();
    }
}
