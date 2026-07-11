package com.pos.backend.service.Authentication;

import java.text.ParseException;
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
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.Authentication.LoginRequest;
import com.pos.backend.dto.response.Authentication.LoginResponse;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class LoginService {

    final UserRepository userRepository;
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

        String accessToken = generateToken(user, accessTokenExpiration, "access");
        String refreshToken = generateToken(user, refreshTokenExpiration, "refresh");

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public LoginResponse refreshToken(String refreshToken) {

        try {
            SignedJWT signedJWT = SignedJWT.parse(refreshToken);

            MACVerifier verifier = new MACVerifier(signerKey.getBytes());

            if (!signedJWT.verify(verifier)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            if (claims.getExpirationTime().before(new Date())) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String tokenType = claims.getStringClaim("token_type");
            if (!"refresh".equals(tokenType)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

            String newAccessToken = generateToken(user, accessTokenExpiration, "access");
            String newRefreshToken = generateToken(user, refreshTokenExpiration, "refresh");

            return LoginResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .build();

        } catch (ParseException | JOSEException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private String generateToken(User user, long expirationMinutes, String tokenType) {

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("restaurant-pos.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES)))
                .claim("token_type", tokenType)
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
}
