package com.pos.backend.service.Administration;

import com.pos.backend.dto.request.Administration.RolePermissionsUpdateRequest;
import com.pos.backend.dto.response.Administration.PermissionModuleResponse;
import com.pos.backend.dto.response.Administration.RolePermissionsResponse;
import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.RolePermission;
import com.pos.backend.exception.AppException;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.repository.PermissionModuleRepository;
import com.pos.backend.repository.RolePermissionRepository;
import com.pos.backend.repository.RoleRepository;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {

    RoleRepository roleRepository;
    PermissionModuleRepository moduleRepository;
    RolePermissionRepository rolePermissionRepository;

    /**
     * Get permissions for a role, returning all modules with their permission flags.
     * Modules without explicit role_permissions entry will have all flags as false.
     */
    public RolePermissionsResponse getRolePermissions(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        List<PermissionModule> allModules = moduleRepository.findAll();
        List<RolePermission> existingPermissions = rolePermissionRepository.findByRole(role);

        Map<Long, RolePermission> permMap = existingPermissions.stream()
                .collect(Collectors.toMap(rp -> rp.getModule().getId(), Function.identity()));

        List<PermissionModuleResponse> permissions = allModules.stream()
                .map(module -> {
                    RolePermission rp = permMap.get(module.getId());
                    return PermissionModuleResponse.builder()
                            .module(module.getName())
                            .view(rp != null && rp.isCanView())
                            .add(rp != null && rp.isCanAdd())
                            .edit(rp != null && rp.isCanEdit())
                            .delete(rp != null && rp.isCanDelete())
                            .export(rp != null && rp.isCanExport())
                            .approvedVoid(rp != null && rp.isCanApproveVoid())
                            .build();
                })
                .collect(Collectors.toList());

        return RolePermissionsResponse.builder()
                .roleId(role.getId())
                .roleName(role.getName())
                .permissions(permissions)
                .build();
    }

    /**
     * Update (upsert) permissions for a role. For each module in the request,
     * the corresponding role_permissions row is created or updated.
     */
    @Transactional
    public void updateRolePermissions(Long roleId, RolePermissionsUpdateRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        for (RolePermissionsUpdateRequest.PermissionModuleEntry entry : request.getPermissions()) {
            PermissionModule module = moduleRepository.findByName(entry.getModule())
                    .orElseThrow(() -> new AppException(ErrorCode.MODULE_NOT_FOUND));

            RolePermission rp = rolePermissionRepository.findByRoleAndModule(role, module)
                    .orElse(RolePermission.builder()
                            .role(role)
                            .module(module)
                            .build());

            rp.setCanView(entry.isView());
            rp.setCanAdd(entry.isAdd());
            rp.setCanEdit(entry.isEdit());
            rp.setCanDelete(entry.isDelete());
            rp.setCanExport(entry.isExport());
            rp.setCanApproveVoid(entry.isApprovedVoid());

            rolePermissionRepository.save(rp);
        }
    }
}
