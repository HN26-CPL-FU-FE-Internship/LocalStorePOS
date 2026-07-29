package com.pos.backend.service.Audit;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.dto.response.Audit.AuditLogResponse;
import com.pos.backend.entity.AuditLog;
import com.pos.backend.entity.User;
import com.pos.backend.repository.AuditLogRepository;
import com.pos.backend.service.Common.PageResponse;

import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuditLogService {

    AuditLogRepository auditLogRepository;

    /**
     * Log an audit event.
     */
    @Transactional
    public AuditLog log(
            User user,
            AuditAction action,
            String module,
            String entityType,
            Long entityId,
            String description,
            String oldValue,
            String newValue,
            String status,
            String ipAddress) {

        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .module(module)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .oldValue(oldValue)
                .newValue(newValue)
                .actionStatus(status != null ? status : "SUCCESS")
                .ipAddress(ipAddress)
                .build();

        return auditLogRepository.save(auditLog);
    }

    /**
     * Simple overload: log without optional fields.
     */
    @Transactional
    public AuditLog log(User user, AuditAction action, String description, String ipAddress) {
        return log(user, action, null, null, null, description, null, null, "SUCCESS", ipAddress);
    }

    /**
     * Log a system error (no user context).
     */
    @Transactional
    public AuditLog logSystemError(String description, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .user(null)
                .action(AuditAction.SYSTEM_ERROR)
                .module("SYSTEM")
                .description(description)
                .actionStatus("FAILED")
                .ipAddress(ipAddress)
                .build();

        return auditLogRepository.save(auditLog);
    }

    /**
     * Get paginated audit logs with filtering.
     */
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(
            String module,
            String action,
            String status,
            String search,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            int page,
            int size) {

        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<AuditLog> spec = buildFilterSpec(module, action, status, search, fromDate, toDate);
        Page<AuditLog> auditLogPage = auditLogRepository.findAll(spec, pageable);

        return PageResponse.<AuditLogResponse>builder()
                .items(auditLogPage.getContent().stream()
                        .map(this::toResponse)
                        .toList())
                .page(auditLogPage.getNumber())
                .size(auditLogPage.getSize())
                .totalElements(auditLogPage.getTotalElements())
                .totalPages(auditLogPage.getTotalPages())
                .first(auditLogPage.isFirst())
                .last(auditLogPage.isLast())
                .build();
    }

    /**
     * Build JPA specification for filtering.
     */
    private Specification<AuditLog> buildFilterSpec(
            String module,
            String action,
            String status,
            String search,
            LocalDateTime fromDate,
            LocalDateTime toDate) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (module != null && !module.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("module"), module));
            }

            if (action != null && !action.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("action"), action));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("actionStatus"), status));
            }

            if (fromDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }

            if (toDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate searchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("entityType")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("module")), pattern));
                predicates.add(searchPredicate);
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Build list of available modules for the filter dropdown.
     */
    public List<String> getAvailableModules() {
        return List.of(
                "AUTHENTICATION",
                "USER_MANAGEMENT",
                "ORDER",
                "PAYMENT",
                "REFUND",
                "VOID",
                "DISCOUNT",
                "CASH_DRAWER",
                "INVENTORY",
                "SETTINGS",
                "MENU_PRICE",
                "API",
                "SYSTEM");
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .userId(auditLog.getUser() != null ? auditLog.getUser().getId() : null)
                .userName(auditLog.getUser() != null
                        ? auditLog.getUser().getFirstName() + " " + auditLog.getUser().getLastName()
                        : "System")
                .userEmail(auditLog.getUser() != null ? auditLog.getUser().getEmail() : null)
                .action(auditLog.getAction() != null ? auditLog.getAction().name() : null)
                .module(auditLog.getModule())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .description(auditLog.getDescription())
                .oldValue(auditLog.getOldValue())
                .newValue(auditLog.getNewValue())
                .actionStatus(auditLog.getActionStatus())
                .ipAddress(auditLog.getIpAddress())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
