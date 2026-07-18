package com.pos.backend.service.Administration.Permission;

import com.pos.backend.dto.request.Administration.UserPermissionsUpdateRequest;
import com.pos.backend.dto.response.Administration.PermissionModuleResponse;
import com.pos.backend.dto.response.Administration.UserPermissionsResponse;
import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.RolePermission;
import com.pos.backend.entity.User;
import com.pos.backend.entity.UserPermissionOverride;
import com.pos.backend.exception.AppException;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.repository.PermissionModuleRepository;
import com.pos.backend.repository.RolePermissionRepository;
import com.pos.backend.repository.UserPermissionOverrideRepository;
import com.pos.backend.repository.UserRepository;

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
public class UserPermissionService {

        UserRepository userRepository;
        PermissionModuleRepository moduleRepository;
        RolePermissionRepository rolePermissionRepository;
        UserPermissionOverrideRepository overrideRepository;

        /**
         * Get effective permissions for a user.
         * Priority: user_permission_overrides -> role_permissions -> false
         */
        public UserPermissionsResponse getUserPermissions(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                List<PermissionModule> allModules = moduleRepository.findAll();

                // Get role-level permissions
                List<RolePermission> rolePerms = rolePermissionRepository.findByRole(user.getRole());
                Map<Long, RolePermission> rolePermMap = rolePerms.stream()
                                .collect(Collectors.toMap(rp -> rp.getModule().getId(), Function.identity()));

                // Get user-level overrides
                List<UserPermissionOverride> overrides = overrideRepository.findByUser(user);
                Map<Long, UserPermissionOverride> overrideMap = overrides.stream()
                                .collect(Collectors.toMap(ov -> ov.getModule().getId(), Function.identity()));

                List<PermissionModuleResponse> permissions = allModules.stream()
                                .map(module -> {
                                        RolePermission rp = rolePermMap.get(module.getId());
                                        UserPermissionOverride ov = overrideMap.get(module.getId());

                                        // Effective = override ?? role ?? false
                                        boolean view = resolve(ov != null ? ov.getCanView() : null,
                                                        rp != null ? rp.isCanView() : false);
                                        boolean add = resolve(ov != null ? ov.getCanAdd() : null,
                                                        rp != null ? rp.isCanAdd() : false);
                                        boolean edit = resolve(ov != null ? ov.getCanEdit() : null,
                                                        rp != null ? rp.isCanEdit() : false);
                                        boolean delete = resolve(ov != null ? ov.getCanDelete() : null,
                                                        rp != null ? rp.isCanDelete() : false);
                                        boolean export_ = resolve(ov != null ? ov.getCanExport() : null,
                                                        rp != null ? rp.isCanExport() : false);
                                        boolean approvedVoid = resolve(ov != null ? ov.getCanApproveVoid() : null,
                                                        rp != null ? rp.isCanApproveVoid() : false);

                                        return PermissionModuleResponse.builder()
                                                        .module(module.getName())
                                                        .view(view)
                                                        .add(add)
                                                        .edit(edit)
                                                        .delete(delete)
                                                        .export(export_)
                                                        .approvedVoid(approvedVoid)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                return UserPermissionsResponse.builder()
                                .userId(user.getId())
                                .userName(user.getFirstName() + " " + user.getLastName())
                                .permissions(permissions)
                                .build();
        }

        /**
         * Update user permission overrides.
         * For each module in the request, upsert the override row.
         * Modules not in the request keep their existing overrides (or none).
         */
        @Transactional
        public void updateUserPermissions(Long userId, UserPermissionsUpdateRequest request) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                for (UserPermissionsUpdateRequest.ModuleEntry entry : request.getPermissions()) {
                        PermissionModule module = moduleRepository.findByName(entry.getModule())
                                        .orElseThrow(() -> new AppException(ErrorCode.MODULE_NOT_FOUND));

                        UserPermissionOverride ov = overrideRepository.findByUserAndModule(user, module)
                                        .orElse(UserPermissionOverride.builder()
                                                        .user(user)
                                                        .module(module)
                                                        .build());

                        ov.setCanView(entry.isView());
                        ov.setCanAdd(entry.isAdd());
                        ov.setCanEdit(entry.isEdit());
                        ov.setCanDelete(entry.isDelete());
                        ov.setCanExport(entry.isExport());
                        ov.setCanApproveVoid(entry.isApprovedVoid());

                        overrideRepository.save(ov);
                }
        }

        /**
         * Resolve nullable Boolean: if override is non-null use it, otherwise fallback.
         */
        private boolean resolve(Boolean override, boolean fallback) {
                return override != null ? override : fallback;
        }
}
