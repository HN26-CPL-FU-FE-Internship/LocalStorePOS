package com.pos.backend.controller.Administration;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.dto.request.Administration.RoleCreateRequest;
import com.pos.backend.dto.request.Administration.RolePermissionsUpdateRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Administration.RolePermissionsResponse;
import com.pos.backend.dto.response.Administration.RoleResponse;
import com.pos.backend.entity.Role;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.RolePermissionRepository;
import com.pos.backend.repository.RoleRepository;
import com.pos.backend.service.Administration.Permission.PermissionService;
import com.pos.backend.service.Audit.AuditLogService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionService permissionService;
    private final AuditLogService auditLogService;

        @GetMapping
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'view')")
        public ApiResponse<List<RoleResponse>> getRoles() {
                List<RoleResponse> roles = roleRepository.findAll()
                                .stream()
                                .map(role -> RoleResponse.builder()
                                                .id(role.getId())
                                                .name(role.getName())
                                                .isSystemRole(role.isSystemRole())
                                                .build())
                                .toList();
                return ApiResponse.<List<RoleResponse>>builder()
                                .result(roles)
                                .build();
        }

        @PostMapping
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'add')")
        public ApiResponse<RoleResponse> createRole(@Valid @RequestBody RoleCreateRequest request) {
                Role role = roleRepository.save(Role.builder()
                                .name(request.getName())
                                .isSystemRole(false)
                                .build());
                auditLogService.log(null, AuditAction.ROLE_CREATED, "USER_MANAGEMENT", "Role", role.getId(),
                "Role created: " + role.getName(), null, null, "SUCCESS", null);

        return ApiResponse.<RoleResponse>builder()
                                .result(RoleResponse.builder()
                                                .id(role.getId())
                                                .name(role.getName())
                                                .isSystemRole(false)
                                                .build())
                                .message("Role created successfully")
                                .build();
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'delete')")
        public ApiResponse<Void> deleteRole(@PathVariable Long id) {
                Role role = roleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                if (role.isSystemRole()) {
                        throw new AppException(ErrorCode.ROLE_NOT_ASSIGNABLE);
                }
                rolePermissionRepository.deleteByRole(role);
                roleRepository.delete(role);

                auditLogService.log(null, AuditAction.ROLE_DELETED, "USER_MANAGEMENT", "Role", id,
                        "Role deleted: " + role.getName(), null, null, "SUCCESS", null);

                return ApiResponse.<Void>builder()
                                .message("Role deleted successfully")
                                .build();
        }

        @GetMapping("/{roleId}/permissions")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'view')")
        public ApiResponse<RolePermissionsResponse> getRolePermissions(@PathVariable Long roleId) {
                return ApiResponse.<RolePermissionsResponse>builder()
                                .result(permissionService.getRolePermissions(roleId))
                                .build();
        }

        @PutMapping("/{roleId}/permissions")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
        public ApiResponse<Void> updateRolePermissions(
                        @PathVariable Long roleId,
                        @Valid @RequestBody RolePermissionsUpdateRequest request) {
                permissionService.updateRolePermissions(roleId, request);

                auditLogService.log(null, AuditAction.PERMISSION_UPDATED, "USER_MANAGEMENT", "Role", roleId,
                        "Permissions updated for role ID: " + roleId, null, null, "SUCCESS", null);

                return ApiResponse.<Void>builder()
                                .message("Permissions updated successfully")
                                .build();
        }

        @PostMapping("/{roleId}/permissions/reset")
        @PreAuthorize("@perm.hasPermission(authentication, 'Manage Staffs', 'edit')")
        public ApiResponse<Void> resetRolePermissions(@PathVariable Long roleId) {
                permissionService.resetRolePermissions(roleId);

                auditLogService.log(null, AuditAction.PERMISSION_UPDATED, "USER_MANAGEMENT", "Role", roleId,
                        "Permissions reset to default for role ID: " + roleId, null, null, "SUCCESS", null);

                return ApiResponse.<Void>builder()
                                .message("Permissions reset to default")
                                .build();
        }
}
