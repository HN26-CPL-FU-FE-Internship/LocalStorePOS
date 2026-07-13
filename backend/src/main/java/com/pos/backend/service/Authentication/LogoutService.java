package com.pos.backend.service.Authentication;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.pos.backend.entity.UserSession;
import com.pos.backend.repository.UserSessionRepository;
import com.pos.backend.service.Common.UserSessionService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class LogoutService {

    final UserSessionRepository userSessionRepository;
    final UserSessionService userSessionService;

    @Transactional
    public void logout(String refreshToken) {
        UserSession session = userSessionService.getSession(refreshToken);

        session.setRevoked(true);

        userSessionRepository.save(session);

        userSessionRepository.cleanup(Instant.now());
    }
}
