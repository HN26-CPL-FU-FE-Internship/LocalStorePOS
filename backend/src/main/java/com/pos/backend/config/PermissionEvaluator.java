package com.pos.backend.config;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.pos.backend.dto.response.Administration.PermissionModuleResponse;
import com.pos.backend.entity.User;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Administration.Permission.UserPermissionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Bean referenced by @PreAuthorize("@perm.hasPermission(...)").
 * Checks whether the authenticated user has the required permission
 * for a given module and action.
 */
@Component("perm")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionEvaluator {

    UserRepository userRepository;
    UserPermissionService userPermissionService;

    /**
     * Check if the current user has the specified permission action for a module.
     * 
     * @param authentication Spring Security authentication object
     * @param module         the permission module name (e.g. "Manage Staffs",
     *                       "Dashboard")
     * @param action         the action to check ("view", "add", "edit", "delete",
     *                       "export", "approvedVoid")
     * @return true if the user has the permission
     */
    public boolean hasPermission(Authentication authentication, String module, String action) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmailWithRole(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        List<PermissionModuleResponse> permissions = userPermissionService.getEffectivePermissions(user);

        return permissions.stream()
                .filter(p -> p.getModule().equals(module))
                .findFirst()
                .map(p -> switch (action) {
                    case "view" -> p.isView();
                    case "add" -> p.isAdd();
                    case "edit" -> p.isEdit();
                    case "delete" -> p.isDelete();
                    case "export" -> p.isExport();
                    case "approvedVoid" -> p.isApprovedVoid();
                    default -> false;
                })
                .orElse(false);
    }
}
