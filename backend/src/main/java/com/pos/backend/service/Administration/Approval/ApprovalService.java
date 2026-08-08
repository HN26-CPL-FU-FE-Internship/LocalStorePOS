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
        @Transactional(readOnly = true)
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
        @Transactional(readOnly = true)
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

                ensureNotOwnRequest(request, approver);

                if (request.getStatus() != ApprovalStatus.PENDING) {
                        throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED);
                }

                request.setStatus(ApprovalStatus.APPROVED);
                request.setApprovedBy(approver);
                request.setResolvedAt(LocalDateTime.now());
                request.setRejectionReason(actionRequest.getReason());
                approvalRequestRepository.save(request);

                // Execute the underlying business action now that the request
                // has been approved (only then is the change applied). If the
                // action fails, the executor flips the request to FAILED.
                //
                // The action itself commits in a separate (REQUIRES_NEW)
                // transaction, so if anything below fails the request status
                // rolls back while the action may already be applied — a
                // known trade-off, kept because the notification writes here
                // are practically infallible.
                approvalRequestExecutor.execute(request);

                // Remove the pending broadcast notification so the resolved
                // request no longer shows up in the notifications dropdown.
                notificationService.deleteTargetNotifications(
                                request.getRequestType().name(), request.getId());

                boolean failed = request.getStatus() == ApprovalStatus.FAILED;
                if (!failed) {
                        auditLogService.log(approver, AuditAction.APPROVAL_REQUEST_APPROVED,
                                        "ADMINISTRATION", "ApprovalRequest", request.getId(),
                                        "Approval request approved: " + request.getDescription()
                                                        + " | Type: " + request.getRequestType()
                                                        + " | Reason: " + actionRequest.getReason(),
                                        null, null, "SUCCESS", null);
                }

                // Notify the requester via WebSocket
                String notifyTitle = failed ? "Approval execution failed" : "Approval request approved";
                String notifyMsg = failed
                                ? "Request \"" + request.getDescription() + "\" was approved by "
                                                + approver.getFirstName() + " " + approver.getLastName()
                                                + " but the action could not be executed. Please check the approval request for details."
                                : "Request \"" + request.getDescription()
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
                return resolveRequest(requestId, actionRequest, rejector, ApprovalStatus.REJECTED,
                                AuditAction.APPROVAL_REQUEST_REJECTED, "Approval Request Rejected", false);
        }

        /**
         * Shared resolution path for approve/reject: update status, persist, log
         * audit event and notify the requester.
         */
        private ApprovalRequestResponse resolveRequest(Long requestId, ApprovalActionRequest actionRequest,
                        User actor, ApprovalStatus targetStatus, AuditAction auditAction,
                        String notifyTitle, boolean approved) {
                ApprovalRequest request = approvalRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));

                ensureNotOwnRequest(request, actor);

                if (request.getStatus() != ApprovalStatus.PENDING) {
                        throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED);
                }

                request.setStatus(targetStatus);
                request.setApprovedBy(actor);
                request.setRejectionReason(actionRequest.getReason());
                request.setResolvedAt(LocalDateTime.now());
                approvalRequestRepository.save(request);

                String verb = approved ? "approved" : "rejected";
                auditLogService.log(actor, auditAction,
                                "ADMINISTRATION", "ApprovalRequest", request.getId(),
                                "Approval request " + verb + ": " + request.getDescription()
                                                + " | Type: " + request.getRequestType()
                                                + " | Reason: " + actionRequest.getReason(),
                                null, null, "SUCCESS", null);

                String actorName = actor.getFirstName() + " " + actor.getLastName();
                String notifyMsg = "Request \"" + request.getDescription()
                                + "\" has been " + verb + " by " + actorName
                                + (approved ? "." : ". Reason: " + actionRequest.getReason());

                // Remove the pending broadcast notification so the resolved
                // request no longer shows up in the notifications dropdown.
                notificationService.deleteTargetNotifications(
                                request.getRequestType().name(), request.getId());

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
         * Prevent users from approving or rejecting their own requests.
         */
        private void ensureNotOwnRequest(ApprovalRequest request, User actor) {
                if (request.getRequestedBy().getId().equals(actor.getId())) {
                        throw new AppException(ErrorCode.CANNOT_RESOLVE_OWN_REQUEST);
                }
        }

        /**
         * Get count of pending approval requests.
         */
        @Transactional(readOnly = true)
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
