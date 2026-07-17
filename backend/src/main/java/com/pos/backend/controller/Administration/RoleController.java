package com.pos.backend.controller.Administration;

import com.pos.backend.constant.ErrorCode;
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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

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

        @GetMapping
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
        public ApiResponse<RoleResponse> createRole(@Valid @RequestBody RoleCreateRequest request) {
                Role role = roleRepository.save(Role.builder()
                                .name(request.getName())
                                .isSystemRole(false)
                                .build());
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
        public ApiResponse<Void> deleteRole(@PathVariable Long id) {
                Role role = roleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                if (role.isSystemRole()) {
                        throw new AppException(ErrorCode.ROLE_NOT_ASSIGNABLE);
                }
                rolePermissionRepository.deleteByRole(role);
                roleRepository.delete(role);
                return ApiResponse.<Void>builder()
                                .message("Role deleted successfully")
                                .build();
        }

        @GetMapping("/{roleId}/permissions")
        public ApiResponse<RolePermissionsResponse> getRolePermissions(@PathVariable Long roleId) {
                return ApiResponse.<RolePermissionsResponse>builder()
                                .result(permissionService.getRolePermissions(roleId))
                                .build();
        }

        @PutMapping("/{roleId}/permissions")
        public ApiResponse<Void> updateRolePermissions(
                        @PathVariable Long roleId,
                        @Valid @RequestBody RolePermissionsUpdateRequest request) {
                permissionService.updateRolePermissions(roleId, request);
                return ApiResponse.<Void>builder()
                                .message("Permissions updated successfully")
                                .build();
        }

        @PostMapping("/{roleId}/permissions/reset")
        public ApiResponse<Void> resetRolePermissions(@PathVariable Long roleId) {
                permissionService.resetRolePermissions(roleId);
                return ApiResponse.<Void>builder()
                                .message("Permissions reset to default")
                                .build();
        }
}
