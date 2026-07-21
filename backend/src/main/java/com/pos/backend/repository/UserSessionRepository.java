package com.pos.backend.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.entity.UserSession;

import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    @EntityGraph(attributePaths = {"user", "user.role"})
    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("""
            Delete From UserSession us Where us.expiresAt < :now
            """)
    void cleanup(@Param("now") Instant now);
}
