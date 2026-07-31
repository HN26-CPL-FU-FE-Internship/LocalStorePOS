package com.pos.backend.service.Administration.Approval;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.dto.request.Administration.ApprovalActionRequest;
import com.pos.backend.dto.request.Administration.ApprovalRequestFilter;
import com.pos.backend.dto.response.Administration.ApprovalRequestResponse;
import com.pos.backend.entity.ApprovalRequest;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.repository.ApprovalRequestRepository;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.NotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApprovalService {

        ApprovalRequestRepository approvalRequestRepository;
        AuditLogService auditLogService;
        NotificationService notificationService;
        ApprovalRequestExecutor approvalRequestExecutor;

        /**
         * Get paginated list of approval requests with optional filters.
         */
        public PageResponse<ApprovalRequestResponse> getApprovalRequests(ApprovalRequestFilter filter) {
                PageRequest pageRequest = PageRequest.of(
                                filter.getPage(),
                                filter.getSize(),
                                Sort.by(Sort.Direction.DESC, "createdAt"));

                Page<ApprovalRequest> page;
                if (filter.getStatus() != null || filter.getRequestType() != null) {
                        page = approvalRequestRepository.findByFilters(
                                        filter.getStatus(),
                                        filter.getRequestType(),
                                        pageRequest);
                } else {
                        page = approvalRequestRepository.findAllByOrderByCreatedAtDesc(pageRequest);
                }

                return PageResponse.<ApprovalRequestResponse>builder()
                                .items(page.getContent().stream().map(this::toResponse).toList())
                                .page(page.getNumber())
                                .size(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .first(page.isFirst())
                                .last(page.isLast())
                                .build();
        }

        /**
         * Get a single approval request by ID.
         */
        public ApprovalRequestResponse getApprovalRequestById(Long id) {
                ApprovalRequest request = approvalRequestRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));
                return toResponse(request);
        }

        /**
         * Approve a pending approval request.
         */
        @Transactional
        public ApprovalRequestResponse approveRequest(Long requestId, ApprovalActionRequest actionRequest,
                        User approver) {
                ApprovalRequest request = approvalRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));

                if (request.getStatus() != ApprovalStatus.PENDING) {
                        throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED);
                }

                request.setStatus(ApprovalStatus.APPROVED);
                request.setApprovedBy(approver);
                request.setResolvedAt(LocalDateTime.now());
                request.setRejectionReason(actionRequest.getReason());
                approvalRequestRepository.save(request);

                // Execute the underlying business action now that the request
                // has been approved (only then is the change applied).
                approvalRequestExecutor.execute(request);

                auditLogService.log(approver, AuditAction.APPROVAL_REQUEST_APPROVED,
                                "ADMINISTRATION", "ApprovalRequest", request.getId(),
                                "Approval request approved: " + request.getDescription()
                                                + " | Type: " + request.getRequestType()
                                                + " | Reason: " + actionRequest.getReason(),
                                null, null, "SUCCESS", null);

                // Notify the requester via WebSocket
                String notifyTitle = "Approval request approved";
                String notifyMsg = "Request \"" + request.getDescription()
                                + "\" was approved by " + approver.getFirstName() + " " + approver.getLastName()
                                + ".";
                notificationService.createNotification(notifyTitle, notifyMsg, request.getRequestedBy());

                return toResponse(request);
        }

        /**
         * Reject a pending approval request.
         */
        @Transactional
        public ApprovalRequestResponse rejectRequest(Long requestId, ApprovalActionRequest actionRequest,
                        User rejector) {
                ApprovalRequest request = approvalRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));

                if (request.getStatus() != ApprovalStatus.PENDING) {
                        throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED);
                }

                request.setStatus(ApprovalStatus.REJECTED);
                request.setApprovedBy(rejector);
                request.setRejectionReason(actionRequest.getReason());
                request.setResolvedAt(LocalDateTime.now());
                approvalRequestRepository.save(request);

                auditLogService.log(rejector, AuditAction.APPROVAL_REQUEST_REJECTED,
                                "ADMINISTRATION", "ApprovalRequest", request.getId(),
                                "Approval request rejected: " + request.getDescription()
                                                + " | Type: " + request.getRequestType()
                                                + " | Reason: " + actionRequest.getReason(),
                                null, null, "SUCCESS", null);

                // Notify the requester via WebSocket
                String notifyTitle = "Approval request rejected";
                String notifyMsg = "Request \"" + request.getDescription()
                                + "\" was rejected by " + rejector.getFirstName() + " " + rejector.getLastName()
                                + ". Reason: " + actionRequest.getReason();
                notificationService.createNotification(notifyTitle, notifyMsg, request.getRequestedBy());

                return toResponse(request);
        }

        /**
         * Create a new approval request and push notification to admins via WebSocket.
         */
        @Transactional
        public ApprovalRequestResponse createRequest(
                        ApprovalRequestType requestType,
                        User requester,
                        String description,
                        String reason,
                        String targetType,
                        Long targetId,
                        String targetDisplay,
                        String oldValue,
                        String newValue,
                        String additionalData) {

                // Prevent duplicate pending requests for the same target action.
                if (targetId != null && hasPendingRequest(requestType, targetId)) {
                        throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_EXISTS);
                }

                ApprovalRequest request = ApprovalRequest.builder()
                                .requestType(requestType)
                                .status(ApprovalStatus.PENDING)
                                .requestedBy(requester)
                                .description(description)
                                .reason(reason)
                                .targetType(targetType)
                                .targetId(targetId)
                                .targetDisplay(targetDisplay)
                                .oldValue(oldValue)
                                .newValue(newValue)
                                .additionalData(additionalData)
                                .build();

                request = approvalRequestRepository.save(request);

                auditLogService.log(requester, AuditAction.APPROVAL_REQUEST_CREATED,
                                "ADMINISTRATION", "ApprovalRequest", request.getId(),
                                "Approval request created: " + description + " | Type: " + requestType,
                                null, null, "SUCCESS", null);

                // Push real-time notification to admin/supervisor users via broadcast
                notificationService.notifyNewApprovalRequest(request);

                return toResponse(request);
        }

        /**
         * Get count of pending approval requests.
         */
        public long getPendingCount() {
                return approvalRequestRepository.countByStatus(ApprovalStatus.PENDING);
        }

        /**
         * Check if there is already a pending approval request for a given type and
         * target.
         */
        public boolean hasPendingRequest(ApprovalRequestType requestType, Long targetId) {
                return approvalRequestRepository
                                .findByRequestTypeAndStatus(requestType, ApprovalStatus.PENDING)
                                .stream()
                                .anyMatch(r -> r.getTargetId() != null && r.getTargetId().equals(targetId));
        }

        private ApprovalRequestResponse toResponse(ApprovalRequest request) {
                return ApprovalRequestResponse.builder()
                                .id(request.getId())
                                .requestType(request.getRequestType())
                                .status(request.getStatus())
                                .description(request.getDescription())
                                .reason(request.getReason())
                                .rejectionReason(request.getRejectionReason())
                                .targetType(request.getTargetType())
                                .targetId(request.getTargetId())
                                .targetDisplay(request.getTargetDisplay())
                                .oldValue(request.getOldValue())
                                .newValue(request.getNewValue())
                                .additionalData(request.getAdditionalData())
                                .resolvedAt(request.getResolvedAt())
                                .createdAt(request.getCreatedAt())
                                .updatedAt(request.getUpdatedAt())
                                .requestedById(request.getRequestedBy().getId())
                                .requestedByName(request.getRequestedBy().getFirstName()
                                                + " " + request.getRequestedBy().getLastName())
                                .requestedByEmail(request.getRequestedBy().getEmail())
                                .approvedById(request.getApprovedBy() != null ? request.getApprovedBy().getId() : null)
                                .approvedByName(request.getApprovedBy() != null
                                                ? request.getApprovedBy().getFirstName() + " "
                                                                + request.getApprovedBy().getLastName()
                                                : null)
                                .approvedByEmail(request.getApprovedBy() != null ? request.getApprovedBy().getEmail()
                                                : null)
                                .build();
        }
}
