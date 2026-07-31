package com.pos.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findByModuleOrderByCreatedAtDesc(String module, Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:module IS NULL OR a.module = :module) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:userId IS NULL OR a.user.id = :userId) AND " +
           "(:status IS NULL OR a.actionStatus = :status) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> search(
            @Param("module") String module,
            @Param("action") String action,
            @Param("userId") Long userId,
            @Param("status") String status,
            Pageable pageable);

    List<AuditLog> findTop20ByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime fromDate, LocalDateTime toDate);
}
