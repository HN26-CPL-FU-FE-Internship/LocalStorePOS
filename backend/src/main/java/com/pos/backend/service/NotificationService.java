package com.pos.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.entity.Notification;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.NotificationRepository;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.WebSocket.WebSocketService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;
    WebSocketService webSocketService;

    // ──────────────────────────────────────────────
    // Notification CRUD
    // ──────────────────────────────────────────────

    /**
     * Get paginated notifications. If userId is null, get broadcast notifications.
     */
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Notification> notificationPage;
        if (userId != null) {
            notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        } else {
            notificationPage = notificationRepository.findByUserIsNullOrderByCreatedAtDesc(pageRequest);
        }

        return PageResponse.<NotificationResponse>builder()
                .items(notificationPage.getContent().stream().map(this::toResponse).toList())
                .page(notificationPage.getNumber())
                .size(notificationPage.getSize())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .first(notificationPage.isFirst())
                .last(notificationPage.isLast())
                .build();
    }

    /**
     * Get unread notification count for a user (or broadcast).
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId != null) {
            return notificationRepository.countByUserIdAndIsReadFalse(userId);
        }
        return notificationRepository.countByUserIsNullAndIsReadFalse();
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        // If notification belongs to a specific user, verify ownership
        if (notification.getUser() != null && userId != null
                && !notification.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        return toResponse(notification);
    }

    /**
     * Mark all notifications as read for a user (or broadcast).
     */
    @Transactional
    public long markAllAsRead(Long userId) {
        List<Notification> unreadNotifications;
        if (userId != null) {
            unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        } else {
            unreadNotifications = notificationRepository.findByUserIsNullAndIsReadFalseOrderByCreatedAtDesc();
        }

        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);

        return unreadNotifications.size();
    }

    /**
     * Create a notification, persist it, and push it via WebSocket (broadcast).
     */
    @Transactional
    public NotificationResponse createNotification(String title, String message, User user) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .user(user)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        NotificationResponse response = toResponse(notification);
        webSocketService.sendTopic("/notifications", response);

        return response;
    }

    /**
     * Push a notification when a new approval request is created.
     * Sends to all connected clients via broadcast topic.
     */
    @Transactional
    public void notifyNewApprovalRequest(com.pos.backend.entity.ApprovalRequest request) {
        String title = "Yêu cầu duyệt mới";
        String message = "[" + request.getRequestType() + "] " + request.getDescription()
                + " - Yêu cầu bởi " + request.getRequestedBy().getFirstName()
                + " " + request.getRequestedBy().getLastName();

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .user(null) // broadcast
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        webSocketService.sendTopic("/notifications", toResponse(notification));
    }

    // ──────────────────────────────────────────────
    // Internal DTO
    // ──────────────────────────────────────────────

    public record NotificationResponse(
            Long id,
            String title,
            String message,
            Boolean isRead,
            Long userId,
            LocalDateTime createdAt) {
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getUser() != null ? notification.getUser().getId() : null,
                notification.getCreatedAt());
    }
}
