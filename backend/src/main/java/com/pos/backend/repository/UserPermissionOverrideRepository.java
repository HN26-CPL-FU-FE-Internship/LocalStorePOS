package com.pos.backend.repository;

import com.pos.backend.entity.PermissionModule;
import com.pos.backend.entity.User;
import com.pos.backend.entity.UserPermissionOverride;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPermissionOverrideRepository extends JpaRepository<UserPermissionOverride, Long> {

    List<UserPermissionOverride> findByUser(User user);

    Optional<UserPermissionOverride> findByUserAndModule(User user, PermissionModule module);

    void deleteByUser(User user);
}
