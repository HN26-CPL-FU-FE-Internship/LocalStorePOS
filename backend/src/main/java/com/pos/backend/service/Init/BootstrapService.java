package com.pos.backend.service.Init;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.RolePermission;
import com.pos.backend.entity.User;
import com.pos.backend.repository.PermissionModuleRepository;
import com.pos.backend.repository.RolePermissionRepository;
import com.pos.backend.repository.RoleRepository;
import com.pos.backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BootstrapService {

    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    PermissionModuleRepository permissionModuleRepository;
    RolePermissionRepository rolePermissionRepository;
    UserRepository userRepository;

    @Transactional
    public void init() {
        // initRoles();
        // initPermissionModules();
        initOwner();
        grantAllPermissionsToOwner();
    }

    // private void initRoles() {
    //     createRoleIfNotExists(DefaultRole.ADMIN.name(), true);
    //     createRoleIfNotExists(DefaultRole.SUPERVISOR.name(), false);
    //     ...
    // }

    // private void initPermissionModules() { ... }

    private void initOwner() {

        if (userRepository.existsByEmail("admin@pos.com")) {
            return;
        }

        // Create the "Admin / Owner" role if it doesn't exist
        // (V1 migration seeds it, but integration tests may clean up)
        Role adminRole = roleRepository.findByName("Admin / Owner")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("Admin / Owner")
                        .isSystemRole(true)
                        .build()));

        userRepository.save(User.builder()
                .email("admin@pos.com")
                .firstName("System")
                .lastName("Admin")
                .phoneNumber("0999999999")
                .passwordHash(passwordEncoder.encode("admin"))
                .role(adminRole)
                .status(CommonStatus.active)
                .build());
    }

    private void grantAllPermissionsToOwner() {
        Role admin = roleRepository.findByName("Admin / Owner")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("Admin / Owner")
                        .isSystemRole(true)
                        .build()));

        List<PermissionModule> permissionModules = permissionModuleRepository.findAll();

        for (PermissionModule module : permissionModules) {
            if (rolePermissionRepository.existsByRoleAndModule(admin, module))
                continue;

            rolePermissionRepository.save(RolePermission.builder()
                    .role(admin)
                    .module(module)
                    .canAdd(true)
                    .canApproveVoid(true)
                    .canDelete(true)
                    .canEdit(true)
                    .canExport(true)
                    .canView(true)
                    .build());
        }
    }

    // private Role createRoleIfNotExists(String name, boolean isSystemRole) {
    //     return roleRepository.findByName(name).orElseGet(() ->
    //             roleRepository.save(Role.builder()
    //                     .name(name)
    //                     .isSystemRole(isSystemRole)
    //                     .build()));
    // }

    // private PermissionModule createPermissionModuleIfNotExists(String name) {
    //     return permissionModuleRepository.findByName(name)
    //             .orElseGet(() -> permissionModuleRepository.save(PermissionModule.builder()
    //                     .name(name)
    //                     .build()));
    // }
}
