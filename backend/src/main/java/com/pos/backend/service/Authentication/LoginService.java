package com.pos.backend.service.Authentication;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.Authentication.LoginRequest;
import com.pos.backend.dto.response.Authentication.LoginResponse;
import com.pos.backend.entity.User;
import com.pos.backend.entity.UserSession;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.repository.UserSessionRepository;
import com.pos.backend.service.Common.UserSessionService;
import com.pos.backend.util.GenerateTokenUtil;
import com.pos.backend.util.HashUtil;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class LoginService {

    final UserRepository userRepository;
    final UserSessionRepository userSessionRepository;
    final UserSessionService userSessionService;
    final PasswordEncoder passwordEncoder;

    @Value("${jwt.signer-key}")
    String signerKey;

    @Value("${jwt.access-token-expiration}")
    long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    long refreshTokenExpiration;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        boolean isValid = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = generateAccessToken(user, accessTokenExpiration);
        String refreshToken = GenerateTokenUtil.generateRefreshToken();

        UserSession session = buildUserSession(refreshToken, user);
        userSessionRepository.save(session);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public LoginResponse refreshToken(String refreshToken) {

        UserSession session = userSessionService.getSession(refreshToken);

        if (session.getRevoked()) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = session.getUser();

        String newAccessToken = generateAccessToken(user, accessTokenExpiration);
        String newRefreshToken = GenerateTokenUtil.generateRefreshToken();

        session.setRefreshTokenHash(HashUtil.sha256(newRefreshToken));
        session.setExpiresAt(Instant.now().plus(refreshTokenExpiration, ChronoUnit.MINUTES));

        userSessionRepository.save(session);
        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    private String generateAccessToken(User user, long expirationMinutes) {

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("restaurant-pos.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES)))
                .jwtID(UUID.randomUUID().toString())
                .build();

        SignedJWT signedJWT = new SignedJWT(header, jwtClaimsSet);

        try {
            JWSSigner signer = new MACSigner(signerKey.getBytes());
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Cannot create token", e);
        }
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
