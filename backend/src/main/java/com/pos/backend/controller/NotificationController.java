package com.pos.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.Administration.ApprovalActionRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Administration.ApprovalRequestResponse;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Administration.Approval.ApprovalService;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.NotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final ApprovalService approvalService;
    private final UserRepository userRepository;

    /**
     * Get paginated notifications for the current user.
     */
    @GetMapping
    public ApiResponse<PageResponse<NotificationService.NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        return ApiResponse.<PageResponse<NotificationService.NotificationResponse>>builder()
                .result(notificationService.getNotifications(userId, page, size))
                .build();
    }

    /**
     * Get unread notification count for the current user.
     */
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ApiResponse.<Long>builder()
                .result(notificationService.getUnreadCount(userId))
                .build();
    }

    /**
     * Mark a notification as read.
     */
    @PutMapping("/{id}/read")
    public ApiResponse<NotificationService.NotificationResponse> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ApiResponse.<NotificationService.NotificationResponse>builder()
                .result(notificationService.markAsRead(id, userId))
                .message("Notification marked as read")
                .build();
    }

    /**
     * Mark all notifications as read for the current user.
     */
    @PutMapping("/read-all")
    public ApiResponse<Long> markAllAsRead(Authentication authentication) {
        Long userId = getUserId(authentication);
        long count = notificationService.markAllAsRead(userId);
        return ApiResponse.<Long>builder()
                .result(count)
                .message(count + " notification(s) marked as read")
                .build();
    }

    /**
     * Accept a simple approval request from notification.
     * Delegates directly to ApprovalService to avoid circular dependency.
     */
    @PostMapping("/approval-requests/{id}/accept")
    @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
    public ApiResponse<ApprovalRequestResponse> acceptApprovalRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionRequest actionRequest,
            Authentication authentication) {

        User approver = getCurrentUser(authentication);
        return ApiResponse.<ApprovalRequestResponse>builder()
                .result(approvalService.approveRequest(id, actionRequest, approver))
                .message("Approval request accepted")
                .build();
    }

    /**
     * Decline a simple approval request from notification.
     * Delegates directly to ApprovalService to avoid circular dependency.
     */
    @PostMapping("/approval-requests/{id}/decline")
    @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
    public ApiResponse<ApprovalRequestResponse> declineApprovalRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionRequest actionRequest,
            Authentication authentication) {

        User rejector = getCurrentUser(authentication);
        return ApiResponse.<ApprovalRequestResponse>builder()
                .result(approvalService.rejectRequest(id, actionRequest, rejector))
                .message("Approval request declined")
                .build();
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private Long getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
