package com.pos.backend.repository;

import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    Boolean existsByRoleAndModule(Role role, PermissionModule module);
}
