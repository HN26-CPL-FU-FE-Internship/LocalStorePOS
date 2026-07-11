package com.pos.backend.service.Init;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.RolePermission;
import com.pos.backend.entity.User;
import com.pos.backend.entity.enums.CommonStatus;
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

    // createRoleIfNotExists(DefaultRole.ADMIN.name(), true);
    // createRoleIfNotExists(DefaultRole.SUPERVISOR.name(), false);
    // createRoleIfNotExists(DefaultRole.ACCOUNTANT.name(), false);
    // createRoleIfNotExists(DefaultRole.CASHIER.name(), false);
    // createRoleIfNotExists(DefaultRole.CHEF.name(), false);
    // createRoleIfNotExists(DefaultRole.DELIVERY.name(), false);
    // createRoleIfNotExists(DefaultRole.WAITER.name(), false);
    // }

    // private void initPermissionModules() {
    // createPermissionModuleIfNotExists(DefaultPermissionModule.CATEGORIES.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.CUSTOMERS.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.DASHBOARD.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.POS.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.PRODUCTS.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.REPORTS.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.SETTINGS.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.REFUND.name());
    // createPermissionModuleIfNotExists(DefaultPermissionModule.RESUME_SALE.name());
    // }

    private void initOwner() {

        if (userRepository.existsByEmail("admin@pos.com")) {
            return;
        }

        Role adminRole = roleRepository.findByName("Admin / Owner").orElseThrow();

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
        Role admin = roleRepository.findByName("Admin / Owner").orElseThrow();

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
    // return roleRepository.findByName(name).orElseGet(() ->
    // roleRepository.save(Role
    // .builder()
    // .name(name)
    // .isSystemRole(isSystemRole)
    // .build()));
    // }

    // private PermissionModule createPermissionModuleIfNotExists(String name) {
    // return permissionModuleRepository.findByName(name)
    // .orElseGet(() -> permissionModuleRepository.save(PermissionModule.builder()
    // .name(name)
    // .build()));
    // }
}
