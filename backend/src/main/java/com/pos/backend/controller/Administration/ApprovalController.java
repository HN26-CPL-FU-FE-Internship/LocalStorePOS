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
                return ApiResponse.<ApprovalRequestResponse>builder()
                                .result(approvalService.approveRequest(id, actionRequest, approver))
                                .message("Approval request approved successfully")
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
         */
        @PostMapping
        @PreAuthorize("isAuthenticated()")
        public ApiResponse<ApprovalRequestResponse> createApprovalRequest(
                        @RequestBody CreateApprovalRequestPayload payload,
                        Authentication authentication) {

                User requester = getCurrentUser(authentication);
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
        // Helper
        // ──────────────────────────────────────────────────────────────

        private User getCurrentUser(Authentication authentication) {
                String email = authentication.getName();
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
}
