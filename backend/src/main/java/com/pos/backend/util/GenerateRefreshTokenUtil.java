package com.pos.backend.util;

import java.security.SecureRandom;
import java.util.Base64;

public class GenerateRefreshTokenUtil {

    public static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String generateRefreshToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        return Base64.getUrlEncoder() // chuyển các kí tự + - / thành - _ đảm bảo dùng tốt cho url, cookie, header,
                                      // json
                .withoutPadding() // bỏ dấu = đi khi random nó sinh ra
                .encodeToString(randomBytes);
    }
}
