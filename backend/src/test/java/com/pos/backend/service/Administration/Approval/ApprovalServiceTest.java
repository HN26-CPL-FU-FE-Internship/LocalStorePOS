package com.pos.backend.service.Administration.Approval;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.dto.request.Administration.ApprovalActionRequest;
import com.pos.backend.dto.request.Administration.ApprovalRequestFilter;
import com.pos.backend.dto.response.Administration.ApprovalRequestResponse;
import com.pos.backend.entity.ApprovalRequest;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.ApprovalRequestRepository;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ApprovalRequestExecutor approvalRequestExecutor;

    @InjectMocks
    private ApprovalService service;

    /* ------------------------------------------------------------ */
    /*  getApprovalRequests                                          */
    /* ------------------------------------------------------------ */

    @Test
    void getApprovalRequests_withFilters_queriesByFilters() {
        ApprovalRequest request = pendingRequest(7L);
        ApprovalRequestFilter filter = ApprovalRequestFilter.builder()
                .status(ApprovalStatus.PENDING)
                .requestType(ApprovalRequestType.PRICE_CHANGE)
                .page(0)
                .size(10)
                .build();
        when(approvalRequestRepository.findByFilters(
                eq(ApprovalStatus.PENDING),
                eq(ApprovalRequestType.PRICE_CHANGE),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(request), Pageable.ofSize(10), 1));

        PageResponse<ApprovalRequestResponse> result = service.getApprovalRequests(filter);

        assertEquals(1, result.getItems().size());
        assertEquals(7L, result.getItems().get(0).getId());
        assertEquals(0, result.getPage());
        assertEquals(10, result.getSize());
        verify(approvalRequestRepository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    void getApprovalRequests_withoutFilters_queriesAll() {
        ApprovalRequest request = pendingRequest(7L);
        ApprovalRequestFilter filter = ApprovalRequestFilter.builder().page(0).size(10).build();
        when(approvalRequestRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(request), Pageable.ofSize(10), 1));

        PageResponse<ApprovalRequestResponse> result = service.getApprovalRequests(filter);

        assertEquals(1, result.getItems().size());
        verify(approvalRequestRepository, never())
                .findByFilters(any(), any(), any(Pageable.class));
    }

    /* ------------------------------------------------------------ */
    /*  getApprovalRequestById                                       */
    /* ------------------------------------------------------------ */

    @Test
    void getApprovalRequestById_whenFound_returnsResponse() {
        ApprovalRequest request = pendingRequest(7L);
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        ApprovalRequestResponse response = service.getApprovalRequestById(7L);

        assertEquals(7L, response.getId());
        assertEquals(ApprovalStatus.PENDING, response.getStatus());
        assertEquals("Alice Smith", response.getRequestedByName());
    }

    @Test
    void getApprovalRequestById_whenNotFound_throws() {
        when(approvalRequestRepository.findById(99L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.getApprovalRequestById(99L));

        assertEquals(ErrorCode.APPROVAL_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    /* ------------------------------------------------------------ */
    /*  approveRequest                                               */
    /* ------------------------------------------------------------ */

    @Test
    void approveRequest_success_updatesStatusExecutesAndNotifies() {
        ApprovalRequest request = pendingRequest(7L);
        User approver = user(2L, "Bob", "Jones");
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        ApprovalRequestResponse response = service.approveRequest(
                7L, new ApprovalActionRequest("Seems fine"), approver);

        assertEquals(ApprovalStatus.APPROVED, response.getStatus());
        assertEquals(ApprovalStatus.APPROVED, request.getStatus());
        assertEquals(approver, request.getApprovedBy());
        assertNotNull(request.getResolvedAt());
        assertEquals("Seems fine", request.getRejectionReason());
        verify(approvalRequestExecutor).execute(request);
        verify(approvalRequestRepository).save(request);
        verify(notificationService).deleteTargetNotifications("PRICE_CHANGE", 7L);
        verify(auditLogService).log(eq(approver), eq(AuditAction.APPROVAL_REQUEST_APPROVED),
                anyString(), anyString(), eq(7L), anyString(), isNull(), isNull(), eq("SUCCESS"),
                isNull());
        verify(notificationService).createNotification(
                eq("Approval request approved"), anyString(), eq(request.getRequestedBy()));
    }

    @Test
    void approveRequest_selfApproval_throws() {
        User requester = user(1L, "Alice", "Smith");
        ApprovalRequest request = pendingRequest(7L);
        request.setRequestedBy(requester);
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        AppException ex = assertThrows(AppException.class, () -> service.approveRequest(
                7L, new ApprovalActionRequest("ok"), requester));

        assertEquals(ErrorCode.CANNOT_RESOLVE_OWN_REQUEST, ex.getErrorCode());
        verify(approvalRequestExecutor, never()).execute(any(ApprovalRequest.class));
    }

    @Test
    void approveRequest_alreadyResolved_throws() {
        ApprovalRequest request = pendingRequest(7L);
        request.setStatus(ApprovalStatus.REJECTED);
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        AppException ex = assertThrows(AppException.class, () -> service.approveRequest(
                7L, new ApprovalActionRequest("ok"), user(2L, "Bob", "Jones")));

        assertEquals(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED, ex.getErrorCode());
        verify(approvalRequestExecutor, never()).execute(any(ApprovalRequest.class));
    }

    @Test
    void approveRequest_whenExecutionFails_marksFailedAndNotifiesFailure() {
        ApprovalRequest request = pendingRequest(7L);
        User approver = user(2L, "Bob", "Jones");
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));
        // Simulate the executor flipping the request to FAILED after a failed action.
        doAnswer(invocation -> {
            request.setStatus(ApprovalStatus.FAILED);
            return null;
        }).when(approvalRequestExecutor).execute(request);

        ApprovalRequestResponse response = service.approveRequest(
                7L, new ApprovalActionRequest("ok"), approver);

        assertEquals(ApprovalStatus.FAILED, response.getStatus());
        // No success audit entry when execution failed.
        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any());
        verify(notificationService).createNotification(
                eq("Approval execution failed"), anyString(), eq(request.getRequestedBy()));
        verify(notificationService).deleteTargetNotifications("PRICE_CHANGE", 7L);
    }

    /* ------------------------------------------------------------ */
    /*  rejectRequest                                                */
    /* ------------------------------------------------------------ */

    @Test
    void rejectRequest_success_updatesStatusAndNotifies() {
        ApprovalRequest request = pendingRequest(7L);
        User rejector = user(2L, "Bob", "Jones");
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        ApprovalRequestResponse response = service.rejectRequest(
                7L, new ApprovalActionRequest("Not allowed"), rejector);

        assertEquals(ApprovalStatus.REJECTED, response.getStatus());
        assertEquals("Not allowed", request.getRejectionReason());
        verify(auditLogService).log(eq(rejector), eq(AuditAction.APPROVAL_REQUEST_REJECTED),
                anyString(), anyString(), eq(7L), anyString(), isNull(), isNull(), eq("SUCCESS"),
                isNull());
        verify(notificationService).createNotification(
                eq("Approval Request Rejected"), anyString(), eq(request.getRequestedBy()));
        verify(approvalRequestExecutor, never()).execute(any(ApprovalRequest.class));
    }

    @Test
    void rejectRequest_selfRejection_throws() {
        User requester = user(1L, "Alice", "Smith");
        ApprovalRequest request = pendingRequest(7L);
        request.setRequestedBy(requester);
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        AppException ex = assertThrows(AppException.class, () -> service.rejectRequest(
                7L, new ApprovalActionRequest("no"), requester));

        assertEquals(ErrorCode.CANNOT_RESOLVE_OWN_REQUEST, ex.getErrorCode());
    }

    @Test
    void rejectRequest_alreadyResolved_throws() {
        ApprovalRequest request = pendingRequest(7L);
        request.setStatus(ApprovalStatus.APPROVED);
        when(approvalRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        AppException ex = assertThrows(AppException.class, () -> service.rejectRequest(
                7L, new ApprovalActionRequest("no"), user(2L, "Bob", "Jones")));

        assertEquals(ErrorCode.APPROVAL_REQUEST_ALREADY_RESOLVED, ex.getErrorCode());
    }

    /* ------------------------------------------------------------ */
    /*  createRequest                                                */
    /* ------------------------------------------------------------ */

    @Test
    void createRequest_whenDuplicatePendingExists_throws() {
        ApprovalRequest existing = pendingRequest(8L);
        existing.setTargetId(5L);
        when(approvalRequestRepository.findByRequestTypeAndStatus(
                ApprovalRequestType.PRICE_CHANGE, ApprovalStatus.PENDING))
                .thenReturn(List.of(existing));

        AppException ex = assertThrows(AppException.class, () -> service.createRequest(
                ApprovalRequestType.PRICE_CHANGE,
                user(1L, "Alice", "Smith"),
                "Change price",
                "New price is lower",
                "ITEM",
                5L,
                "Pizza",
                "15.00",
                "12.00",
                "{\"itemId\":5,\"newPrice\":12}"));

        assertEquals(ErrorCode.APPROVAL_REQUEST_ALREADY_EXISTS, ex.getErrorCode());
        verify(approvalRequestRepository, never()).save(any(ApprovalRequest.class));
    }

    @Test
    void createRequest_success_savesAuditsAndNotifies() {
        User requester = user(1L, "Alice", "Smith");
        when(approvalRequestRepository.findByRequestTypeAndStatus(
                ApprovalRequestType.PRICE_CHANGE, ApprovalStatus.PENDING))
                .thenReturn(List.of());
        when(approvalRequestRepository.save(any(ApprovalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ApprovalRequestResponse response = service.createRequest(
                ApprovalRequestType.PRICE_CHANGE,
                requester,
                "Change price",
                "New price is lower",
                "ITEM",
                5L,
                "Pizza",
                "15.00",
                "12.00",
                "{\"itemId\":5,\"newPrice\":12}");

        assertEquals(ApprovalStatus.PENDING, response.getStatus());
        assertEquals(ApprovalRequestType.PRICE_CHANGE, response.getRequestType());
        assertEquals("Change price", response.getDescription());
        assertEquals(5L, response.getTargetId());
        verify(auditLogService).log(eq(requester), eq(AuditAction.APPROVAL_REQUEST_CREATED),
                anyString(), anyString(), any(), anyString(), isNull(), isNull(), eq("SUCCESS"),
                isNull());
        verify(notificationService).notifyNewApprovalRequest(any(ApprovalRequest.class));
    }

    @Test
    void createRequest_withoutTargetId_skipsDuplicateCheck() {
        when(approvalRequestRepository.save(any(ApprovalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createRequest(
                ApprovalRequestType.PRICE_CHANGE,
                user(1L, "Alice", "Smith"),
                "Change price",
                "New price is lower",
                null,
                null,
                null,
                null,
                null,
                "{\"itemId\":5,\"newPrice\":12}");

        verify(approvalRequestRepository, never()).findByRequestTypeAndStatus(any(), any());
        verify(approvalRequestRepository).save(any(ApprovalRequest.class));
    }

    /* ------------------------------------------------------------ */
    /*  getPendingCount                                              */
    /* ------------------------------------------------------------ */

    @Test
    void getPendingCount_delegatesToRepository() {
        when(approvalRequestRepository.countByStatus(ApprovalStatus.PENDING)).thenReturn(3L);

        assertEquals(3L, service.getPendingCount());
    }

    /* ------------------------------------------------------------ */
    /*  Helpers                                                      */
    /* ------------------------------------------------------------ */

    private ApprovalRequest pendingRequest(Long id) {
        return ApprovalRequest.builder()
                .id(id)
                .requestType(ApprovalRequestType.PRICE_CHANGE)
                .status(ApprovalStatus.PENDING)
                .requestedBy(user(1L, "Alice", "Smith"))
                .description("Change price")
                .reason("New price is lower")
                .targetId(5L)
                .build();
    }

    private User user(Long id, String firstName, String lastName) {
        return User.builder()
                .id(id)
                .firstName(firstName)
                .lastName(lastName)
                .email(firstName.toLowerCase() + "@example.com")
                .build();
    }
}
