package com.pos.backend.repository;

import com.pos.backend.entity.PermissionModule;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionModuleRepository extends JpaRepository<PermissionModule, Long> {

    Optional<PermissionModule> findByName(String name);
}
