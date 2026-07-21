package com.pos.backend.repository;

import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.RolePermission;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    Boolean existsByRoleAndModule(Role role, PermissionModule module);

    List<RolePermission> findByRole(Role role);

    Optional<RolePermission> findByRoleAndModule(Role role, PermissionModule module);

    void deleteByRole(Role role);
}
