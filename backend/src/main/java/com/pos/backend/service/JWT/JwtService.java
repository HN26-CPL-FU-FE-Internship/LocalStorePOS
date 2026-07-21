package com.pos.backend.service.JWT;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;

@Service
public class JwtService {

    @Value("${jwt.signer-key}")
    private String signerKey;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    public String generateToken(User user) {
        // tạo JWT
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("restaurant-pos.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(accessTokenExpiration, ChronoUnit.MINUTES)))
                .jwtID(UUID.randomUUID().toString())
                .build();

        SignedJWT signedJWT = new SignedJWT(header, claimsSet);

        try {
            JWSSigner jwsSigner = new MACSigner(signerKey.getBytes());
            signedJWT.sign(jwsSigner);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new AppException(ErrorCode.CAN_NOT_CREATE_TOKEN);
        }

    }

    public boolean isValid(String token) {
        // kiểm tra signature, exp,...
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            JWSVerifier verifier = new MACVerifier(signerKey);

            boolean isValid = signedJWT.verify(verifier);

            Date expTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            if (!isValid || expTime.before(new Date()))
                return false;
            return true;
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
    }

    // public String extractRole(String token) {

    // }
}