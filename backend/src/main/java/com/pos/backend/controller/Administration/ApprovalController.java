package com.pos.backend.controller.Administration;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.config.PermissionEvaluator;
import com.pos.backend.dto.request.Administration.ApprovalActionRequest;
import com.pos.backend.dto.request.Administration.CreateApprovalRequestPayload;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Administration.ApprovalRequestResponse;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Administration.Approval.ApprovalService;
import com.pos.backend.service.Common.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/approval-requests")
@RequiredArgsConstructor
public class ApprovalController {

        private final ApprovalService approvalService;
        private final UserRepository userRepository;
        private final PermissionEvaluator perm;

        /**
         * Get paginated list of approval requests with optional filters.
         */
        @GetMapping
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'view')")
        public ApiResponse<PageResponse<ApprovalRequestResponse>> getApprovalRequests(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) ApprovalStatus status,
                        @RequestParam(required = false) ApprovalRequestType requestType) {

                var filter = com.pos.backend.dto.request.Administration.ApprovalRequestFilter.builder()
                                .page(page)
                                .size(size)
                                .status(status)
                                .requestType(requestType)
                                .build();

                return ApiResponse.<PageResponse<ApprovalRequestResponse>>builder()
                                .result(approvalService.getApprovalRequests(filter))
                                .build();
        }

        /**
         * Get a single approval request by ID.
         */
        @GetMapping("/{id}")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'view')")
        public ApiResponse<ApprovalRequestResponse> getApprovalRequest(@PathVariable Long id) {
                return ApiResponse.<ApprovalRequestResponse>builder()
                                .result(approvalService.getApprovalRequestById(id))
                                .build();
        }

        /**
         * Approve a pending approval request.
         */
        @PostMapping("/{id}/approve")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
        public ApiResponse<ApprovalRequestResponse> approveRequest(
                        @PathVariable Long id,
                        @Valid @RequestBody ApprovalActionRequest actionRequest,
                        Authentication authentication) {

                User approver = getCurrentUser(authentication);
                ApprovalRequestResponse response = approvalService.approveRequest(id, actionRequest, approver);
                return ApiResponse.<ApprovalRequestResponse>builder()
                                .result(response)
                                .message(response.getStatus() == ApprovalStatus.FAILED
                                                ? "Approval request approved but execution failed"
                                                : "Approval request approved successfully")
                                .build();
        }

        /**
         * Reject a pending approval request.
         */
        @PostMapping("/{id}/reject")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
        public ApiResponse<ApprovalRequestResponse> rejectRequest(
                        @PathVariable Long id,
                        @Valid @RequestBody ApprovalActionRequest actionRequest,
                        Authentication authentication) {

                User rejector = getCurrentUser(authentication);
                return ApiResponse.<ApprovalRequestResponse>builder()
                                .result(approvalService.rejectRequest(id, actionRequest, rejector))
                                .message("Approval request rejected")
                                .build();
        }

        /**
         * Get pending approval requests count.
         */
        @GetMapping("/pending-count")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'view')")
        public ApiResponse<Long> getPendingCount() {
                return ApiResponse.<Long>builder()
                                .result(approvalService.getPendingCount())
                                .build();
        }

        /**
         * Create a new approval request (utility endpoint for other services).
         * Only users who could perform the underlying action directly may
         * request it through the approval workflow.
         */
        @PostMapping
        @PreAuthorize("isAuthenticated()")
        public ApiResponse<ApprovalRequestResponse> createApprovalRequest(
                        @Valid @RequestBody CreateApprovalRequestPayload payload,
                        Authentication authentication) {

                User requester = getCurrentUser(authentication);

                PermissionRequirement requirement = requiredPermission(payload.getRequestType(),
                                payload.getTargetType());
                if (!perm.hasPermission(authentication, requirement.module(), requirement.action())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                return ApiResponse.<ApprovalRequestResponse>builder()
                                .result(approvalService.createRequest(
                                                payload.getRequestType(),
                                                requester,
                                                payload.getDescription(),
                                                payload.getReason(),
                                                payload.getTargetType(),
                                                payload.getTargetId(),
                                                payload.getTargetDisplay(),
                                                payload.getOldValue(),
                                                payload.getNewValue(),
                                                payload.getAdditionalData()))
                                .build();
        }

        // ──────────────────────────────────────────────────────────────
        // Helpers
        // ──────────────────────────────────────────────────────────────

        private User getCurrentUser(Authentication authentication) {
                String email = authentication.getName();
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }

        private record PermissionRequirement(String module, String action) {
        }

        /**
         * Map an approval request type to the permission a user must already
         * hold to be allowed to submit that request (the same permission the
         * underlying action itself would require). DELETE_IMPORTANT_DATA
         * depends on the target entity type.
         */
        private PermissionRequirement requiredPermission(ApprovalRequestType type, String targetType) {
                return switch (type) {
                        case CANCEL_INVOICE, DISCOUNT_EXCEEDS_THRESHOLD, REOPEN_PAID_INVOICE,
                                        COMPLIMENTARY, CANCEL_ITEM_AFTER_KITCHEN ->
                                new PermissionRequirement("Orders", "edit");
                        case CANCEL_KITCHEN_TICKET ->
                                new PermissionRequirement("Kitchen (KDS)", "edit");
                        case REFUND_RETURN ->
                                new PermissionRequirement("Payments", "edit");
                        case PRICE_CHANGE ->
                                new PermissionRequirement("Products", "edit");
                        case PERMISSION_CHANGE, USER_CREATE_DELETE ->
                                new PermissionRequirement("Manage Staffs", "edit");
                        case CREATE_TABLE_FLOOR ->
                                new PermissionRequirement("Tables", "add");
                        case DELETE_IMPORTANT_DATA -> switch (targetType == null ? "" : targetType.toUpperCase()) {
                                case "ITEM" -> new PermissionRequirement("Products", "delete");
                                case "ADDON" -> new PermissionRequirement("Addons", "delete");
                                case "CATEGORY" -> new PermissionRequirement("Categories", "delete");
                                case "CUSTOMER" -> new PermissionRequirement("Customers", "delete");
                                case "COUPON" -> new PermissionRequirement("Coupons", "delete");
                                case "INVOICE" -> new PermissionRequirement("Invoices", "delete");
                                case "TAX" -> new PermissionRequirement("Settings", "delete");
                                // Table/floor deletion is open to anyone who can VIEW the
                                // Tables page (admin applies directly, everyone else's
                                // request must be approved by an admin).
                                case "TABLE", "TABLE_AREA", "TABLE_FLOOR" ->
                                        new PermissionRequirement("Tables", "view");
                                case "RESERVATION" -> new PermissionRequirement("Reservation", "delete");
                                case "ROLE" -> new PermissionRequirement("Manage Staffs", "delete");
                                // Fail closed: unknown/omitted target types are rejected.
                                default -> throw new AppException(ErrorCode.UNAUTHORIZED);
                        };
                };
        }
}
