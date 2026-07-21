package com.pos.backend.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.exception.AppException;

public class HashUtil {

    public static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(value.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder("");

            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }

            return sb.toString();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
