package com.pos.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.entity.UserSession;
import java.util.Optional;


public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);
}
