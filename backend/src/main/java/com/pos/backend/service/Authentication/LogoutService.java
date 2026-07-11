package com.pos.backend.service.Authentication;

import org.springframework.stereotype.Service;

import com.pos.backend.entity.UserSession;
import com.pos.backend.repository.UserSessionRepository;
import com.pos.backend.service.Common.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class LogoutService {

    final UserSessionRepository userSessionRepository;
    final UserSessionService userSessionService;

    public void logout(String refreshToken) {
        UserSession session = userSessionService.getSession(refreshToken);

        session.setRevoked(true);

        userSessionRepository.save(session);
    }
}
