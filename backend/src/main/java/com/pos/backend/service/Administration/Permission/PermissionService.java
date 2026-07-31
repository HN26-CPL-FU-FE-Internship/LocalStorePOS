package com.pos.backend.service.Administration.Permission;

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

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.Map.entry;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {

        RoleRepository roleRepository;
        PermissionModuleRepository moduleRepository;
        RolePermissionRepository rolePermissionRepository;

        /**
         * Get permissions for a role, returning all modules with their permission
         * flags.
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
        /**
         * Delete a non-system role (used when a DELETE_IMPORTANT_DATA approval
         * request with targetType ROLE is approved).
         */
        @Transactional
        public void deleteRole(Long roleId) {
                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                if (role.isSystemRole()) {
                        throw new AppException(ErrorCode.ROLE_NOT_ASSIGNABLE);
                }
                rolePermissionRepository.deleteByRole(role);
                roleRepository.delete(role);
        }

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

        // ------------------------------------------------------------------
        // Reset to default (baseline from V6 migration)
        // ------------------------------------------------------------------

        /** A record holding default flags for one module. */
        private record DefaultPerm(boolean view, boolean add, boolean edit,
                        boolean delete, boolean export, boolean approvedVoid) {
        }

        /** Default permission matrix keyed by role name then by module name. */
        private static final Map<String, Map<String, DefaultPerm>> DEFAULT_PERMISSIONS = Map.ofEntries(
                        /* -- Admin / Owner: full access on all modules -- */
                        entry("Admin / Owner", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("POS", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Hold/Resume Sale", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Refund / Return", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Products", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Categories", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Customers", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Reports", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Settings", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Orders", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Tables", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Reservation", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Kitchen (KDS)", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Invoices", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Payments", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Coupons", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Addons", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Manage Staffs", new DefaultPerm(true, true, true, true, true, true)),
                                        entry("Audit Logs", new DefaultPerm(true, true, true, true, true, true)))),
                        /* -- Supervisor -- */
                        entry("Supervisor", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(true, true, true, false, true, true)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(true, true, false, false, false, true)),
                                        entry("Products", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Customers", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Reports", new DefaultPerm(true, false, false, false, true, false)),
                                        entry("Settings", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, true, true, false, false, true)),
                                        entry("Tables", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Reservation", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Kitchen (KDS)", new DefaultPerm(true, false, true, false, false, false)),
                                        entry("Invoices", new DefaultPerm(true, false, false, false, true, false)),
                                        entry("Payments", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Addons", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Audit Logs", new DefaultPerm(true, false, false, false, false, false)))),
                        /* -- Cashier -- */
                        entry("Cashier", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Settings", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Tables", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Reservation", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Kitchen (KDS)",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Invoices", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Payments", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Audit Logs",
                                                        new DefaultPerm(false, false, false, false, false, false)))),
                        /* -- Chef -- */
                        entry("Chef", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Settings", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Tables", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reservation", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Kitchen (KDS)", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Invoices", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Payments", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Audit Logs",
                                                        new DefaultPerm(false, false, false, false, false, false)))),
                        /* -- Waiter -- */
                        entry("Waiter", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Settings", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Tables", new DefaultPerm(true, false, true, false, false, false)),
                                        entry("Reservation", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Kitchen (KDS)",
                                                        new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Invoices", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Payments", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Audit Logs",
                                                        new DefaultPerm(false, false, false, false, false, false)))),
                        /* -- Delivery -- */
                        entry("Delivery", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Settings", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, false, true, false, false, false)),
                                        entry("Tables", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reservation", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Kitchen (KDS)",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Invoices", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Payments", new DefaultPerm(true, true, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Audit Logs",
                                                        new DefaultPerm(false, false, false, false, false, false)))),
                        /* -- Accountant -- */
                        entry("Accountant", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(true, false, false, false, false, true)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(true, false, false, false, true, false)),
                                        entry("Settings", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Tables", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reservation", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Kitchen (KDS)",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Invoices", new DefaultPerm(true, true, true, false, true, false)),
                                        entry("Payments", new DefaultPerm(true, true, true, false, true, false)),
                                        entry("Coupons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Manage Staffs",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Audit Logs", new DefaultPerm(true, false, false, false, false, false)))),
                        /* -- System Operator -- */
                        entry("System Operator", Map.ofEntries(
                                        entry("Dashboard", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("POS", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Hold/Resume Sale",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Refund / Return",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Products", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Categories", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Customers", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reports", new DefaultPerm(true, false, false, false, true, false)),
                                        entry("Settings", new DefaultPerm(true, true, true, false, false, false)),
                                        entry("Orders", new DefaultPerm(true, false, false, false, false, false)),
                                        entry("Tables", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Reservation", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Kitchen (KDS)",
                                                        new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Invoices", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Payments", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Coupons", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Addons", new DefaultPerm(false, false, false, false, false, false)),
                                        entry("Manage Staffs", new DefaultPerm(true, true, true, true, true, false)),
                                        entry("Audit Logs", new DefaultPerm(true, true, false, false, true, false)))));

        /**
         * Reset permissions for a role to the factory defaults (as defined in V6
         * migration).
         * Only system roles have predefined defaults; custom roles will get all flags =
         * false.
         */
        @Transactional
        public void resetRolePermissions(Long roleId) {
                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

                // Delete all existing permissions for this role
                rolePermissionRepository.deleteByRole(role);
                rolePermissionRepository.flush();

                // Determine default matrix
                Map<String, DefaultPerm> defaults = DEFAULT_PERMISSIONS.get(role.getName());

                List<PermissionModule> allModules = moduleRepository.findAll();
                List<RolePermission> toSave = new ArrayList<>(allModules.size());

                for (PermissionModule module : allModules) {
                        boolean view, add, edit, delete, export_, approvedVoid;

                        if (defaults != null && defaults.containsKey(module.getName())) {
                                DefaultPerm d = defaults.get(module.getName());
                                view = d.view();
                                add = d.add();
                                edit = d.edit();
                                delete = d.delete();
                                export_ = d.export();
                                approvedVoid = d.approvedVoid();
                        } else {
                                // No default → all false
                                view = add = edit = delete = export_ = approvedVoid = false;
                        }

                        toSave.add(RolePermission.builder()
                                        .role(role)
                                        .module(module)
                                        .canView(view)
                                        .canAdd(add)
                                        .canEdit(edit)
                                        .canDelete(delete)
                                        .canExport(export_)
                                        .canApproveVoid(approvedVoid)
                                        .build());
                }

                rolePermissionRepository.saveAll(toSave);
        }
}
