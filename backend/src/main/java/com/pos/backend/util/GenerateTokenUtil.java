package com.pos.backend.util;

import java.security.SecureRandom;
import java.util.Base64;

public class GenerateTokenUtil {

    public static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String generateRefreshToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }
}
