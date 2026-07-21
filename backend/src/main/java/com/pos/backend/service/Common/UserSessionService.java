package com.pos.backend.service.Common;

import org.springframework.stereotype.Service;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.entity.UserSession;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.UserSessionRepository;
import com.pos.backend.util.HashUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;

    public UserSession getSession(String refreshToken) {

        UserSession session = userSessionRepository.findByRefreshTokenHash(HashUtil.sha256(refreshToken))
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        return session;
    }
}
