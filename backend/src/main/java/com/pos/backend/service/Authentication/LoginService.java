package com.pos.backend.service.Authentication;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Authentication.LoginRequest;
import com.pos.backend.dto.response.Administration.PermissionModuleResponse;
import com.pos.backend.dto.response.Authentication.LoginResponse;
import com.pos.backend.entity.User;
import com.pos.backend.entity.UserSession;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.repository.UserSessionRepository;
import com.pos.backend.service.Administration.Permission.UserPermissionService;
import com.pos.backend.service.Common.UserSessionService;
import com.pos.backend.service.JWT.JwtService;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.util.GenerateRefreshTokenUtil;
import com.pos.backend.util.HashUtil;

import jakarta.transaction.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
@Slf4j
public class LoginService {

    final UserRepository userRepository;
    final UserSessionRepository userSessionRepository;
    final UserSessionService userSessionService;
    final JwtService jwtService;
    final PasswordEncoder passwordEncoder;
    final UserPermissionService userPermissionService;
    final AuditLogService auditLogService;

    @Value("${jwt.signer-key}")
    String signerKey;

    @Value("${jwt.refresh-token-expiration}")
    long refreshTokenExpiration;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmailWithRole(request.getEmail())
                .orElseThrow(() -> {
                    auditLogService.log(null, AuditAction.LOGIN_FAILED, "AUTHENTICATION", null, null,
                            "Login failed: email not found - " + request.getEmail(), null, null, "FAILED", null);
                    return new AppException(ErrorCode.INVALID_CREDENTIALS);
                });

        boolean isValid = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!isValid) {
            auditLogService.log(user, AuditAction.LOGIN_FAILED, "AUTHENTICATION", null, null,
                    "Login failed: invalid password for " + request.getEmail(), null, null, "FAILED", null);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.getStatus() == CommonStatus.inactive) {
            auditLogService.log(user, AuditAction.LOGIN_FAILED, "AUTHENTICATION", null, null,
                    "Login failed: user inactive - " + request.getEmail(), null, null, "FAILED", null);
            throw new AppException(ErrorCode.USER_INACTIVE);
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = GenerateRefreshTokenUtil.generateRefreshToken();

        UserSession session = buildUserSession(refreshToken, user);
        userSessionRepository.save(session);

        auditLogService.log(user, AuditAction.LOGIN, "AUTHENTICATION", null, null,
                "User logged in: " + user.getEmail(), null, null, "SUCCESS", null);

        return buildLoginResponse(accessToken, refreshToken, user);
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {

        UserSession session = userSessionService.getSession(refreshToken);

        if (session.getRevoked()) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = session.getUser();

        if (user.getStatus() == CommonStatus.inactive) {
            throw new AppException(ErrorCode.USER_INACTIVE);
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = GenerateRefreshTokenUtil.generateRefreshToken();

        session.setRefreshTokenHash(HashUtil.sha256(newRefreshToken));
        session.setExpiresAt(Instant.now().plus(refreshTokenExpiration, ChronoUnit.MINUTES));
        session.setLastUsedAt(Instant.now());

        userSessionRepository.save(session);
        userSessionRepository.cleanup(Instant.now());

        return buildLoginResponse(newAccessToken, newRefreshToken, user);
    }

    private LoginResponse buildLoginResponse(String accessToken, String refreshToken, User user) {
        java.util.List<PermissionModuleResponse> permissions = userPermissionService.getEffectivePermissions(user);

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().getName())
                .avatarPath(user.getAvatarPath())
                .status(user.getStatus().name())
                .permissions(permissions)
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }

    private UserSession buildUserSession(String refreshToken, User user) {
        return UserSession.builder()
                .user(user)
                .refreshTokenHash(HashUtil.sha256(refreshToken))
                .expiresAt(Instant.now().plus(
                        refreshTokenExpiration, ChronoUnit.MINUTES))
                .revoked(false)
                .build();
    }
}
