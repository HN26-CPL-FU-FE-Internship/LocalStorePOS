package com.pos.backend.controller.Administration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.pos.backend.config.PermissionEvaluator;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.constant.enums.CommonRole;
import com.pos.backend.dto.response.Administration.ApprovalRequestResponse;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.exception.GlobalExceptionHandler;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Administration.Approval.ApprovalService;
import com.pos.backend.service.Audit.AuditLogService;

/**
 * Unit test for {@link ApprovalController#createApprovalRequest} — the
 * defense-in-depth contract that admins are rejected with
 * ADMIN_NO_APPROVAL_NEEDED (400) while other roles pass through normally.
 *
 * <p>
 * The admin guard itself lives in {@link ApprovalService#createRequest}
 * (covered by ApprovalServiceTest); this test verifies the HTTP contract:
 * the controller fetches the requester, checks the required permission, and
 * maps the service's AppException to the right status/code.
 * </p>
 *
 * <p>
 * Standalone MockMvc has no Spring Security filter chain, so the
 * Authentication controller parameter is resolved by Spring's default
 * PrincipalMethodArgumentResolver from the request principal supplied via
 * {@code .principal(...)} on each request.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
class ApprovalControllerTest {

    @Mock
    private ApprovalService approvalService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PermissionEvaluator perm;
    @Mock
    private AuditLogService auditLogService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new ApprovalController(approvalService, userRepository, perm))
                .setControllerAdvice(new GlobalExceptionHandler(auditLogService))
                .build();
    }

    /* ------------------------------------------------------------ */
    /*  createApprovalRequest — admin is blocked (defense in depth)  */
    /* ------------------------------------------------------------ */

    @Test
    void createApprovalRequest_whenAdminRequester_returns400AdminNoApprovalNeeded() throws Exception {
        User admin = user(1L, "admin@pos.com", CommonRole.ADMIN.getDbName());
        when(userRepository.findByEmail("admin@pos.com")).thenReturn(Optional.of(admin));
        when(perm.hasPermission(any(Authentication.class), eq("Products"), eq("edit"))).thenReturn(true);
        // The service guard throws for admins — the controller must surface it as 400.
        when(approvalService.createRequest(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new AppException(ErrorCode.ADMIN_NO_APPROVAL_NEEDED));

        mockMvc.perform(post("/api/approval-requests")
                .principal(new UsernamePasswordAuthenticationToken("admin@pos.com", null))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.ADMIN_NO_APPROVAL_NEEDED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.ADMIN_NO_APPROVAL_NEEDED.getMessage()));

        // The permission gate was still evaluated before delegating to the service.
        verify(perm).hasPermission(any(Authentication.class), eq("Products"), eq("edit"));
    }

    /* ------------------------------------------------------------ */
    /*  createApprovalRequest — non-admin passes through             */
    /* ------------------------------------------------------------ */

    @Test
    void createApprovalRequest_whenNonAdminRequester_returns200() throws Exception {
        User waiter = user(2L, "waiter@pos.com", CommonRole.WAITER.getDbName());
        when(userRepository.findByEmail("waiter@pos.com")).thenReturn(Optional.of(waiter));
        when(perm.hasPermission(any(Authentication.class), eq("Products"), eq("edit"))).thenReturn(true);

        ApprovalRequestResponse response = ApprovalRequestResponse.builder()
                .id(99L)
                .requestType(ApprovalRequestType.PRICE_CHANGE)
                .status(ApprovalStatus.PENDING)
                .description("Change price")
                .targetId(5L)
                .requestedById(2L)
                .requestedByName("Mike Waiter")
                .requestedByEmail("waiter@pos.com")
                .build();
        when(approvalService.createRequest(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/approval-requests")
                .principal(new UsernamePasswordAuthenticationToken("waiter@pos.com", null))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(99))
                .andExpect(jsonPath("$.result.status").value("PENDING"))
                .andExpect(jsonPath("$.result.requestedByEmail").value("waiter@pos.com"));

        verify(approvalService).createRequest(
                eq(ApprovalRequestType.PRICE_CHANGE),
                eq(waiter),
                eq("Change price"),
                eq("New price is lower"),
                eq("ITEM"),
                eq(5L),
                anyString(),
                anyString(),
                anyString(),
                anyString());
    }

    /* ------------------------------------------------------------ */
    /*  createApprovalRequest — permission gate                      */
    /* ------------------------------------------------------------ */

    @Test
    void createApprovalRequest_withoutPermission_returns403() throws Exception {
        User waiter = user(2L, "waiter@pos.com", CommonRole.WAITER.getDbName());
        when(userRepository.findByEmail("waiter@pos.com")).thenReturn(Optional.of(waiter));
        when(perm.hasPermission(any(Authentication.class), eq("Products"), eq("edit"))).thenReturn(false);

        mockMvc.perform(post("/api/approval-requests")
                .principal(new UsernamePasswordAuthenticationToken("waiter@pos.com", null))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.UNAUTHORIZED.getCode()));

        verify(approvalService, never()).createRequest(any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any());
    }

    @Test
    void createApprovalRequest_whenRequesterNotFound_returns404() throws Exception {
        when(userRepository.findByEmail("ghost@pos.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/approval-requests")
                .principal(new UsernamePasswordAuthenticationToken("ghost@pos.com", null))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));

        verify(approvalService, never()).createRequest(any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any());
    }

    /* ------------------------------------------------------------ */
    /*  Helpers                                                      */
    /* ------------------------------------------------------------ */

    private User user(Long id, String email, String roleName) {
        return User.builder()
                .id(id)
                .firstName("Mike")
                .lastName("Test")
                .email(email)
                .role(Role.builder().name(roleName).build())
                .build();
    }

    private String validPayload() {
        return "{"
                + "\"requestType\":\"PRICE_CHANGE\","
                + "\"description\":\"Change price\","
                + "\"reason\":\"New price is lower\","
                + "\"targetType\":\"ITEM\","
                + "\"targetId\":5,"
                + "\"targetDisplay\":\"Pizza\","
                + "\"oldValue\":\"15.00\","
                + "\"newValue\":\"12.00\","
                + "\"additionalData\":\"{\\\"itemId\\\":5,\\\"newPrice\\\":12}\""
                + "}";
    }
}
