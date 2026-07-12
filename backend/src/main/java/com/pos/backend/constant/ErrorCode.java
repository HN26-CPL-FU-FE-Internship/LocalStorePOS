package com.pos.backend.constant;

import org.springframework.http.HttpStatus;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public enum ErrorCode {
        UNCATEGORIZED_EXCEPTION(9999, HttpStatus.INTERNAL_SERVER_ERROR, "Uncategorized Exception"),
        VALID_FAILED(1001, HttpStatus.UNPROCESSABLE_ENTITY, "Validated failed"),
        UNAUTHENTICATED(1002, HttpStatus.UNAUTHORIZED, "Unauthenticated"),
        UNAUTHORIZED(1003, HttpStatus.FORBIDDEN, "You do not have permission!"),
        EMAIL_ALREADY_EXISTS(1004, HttpStatus.BAD_REQUEST, "Email already exists"),

        PHONE_NUMBER_ALREADY_EXISTS(1005, HttpStatus.BAD_REQUEST, "Phone number already exists"),
        ROLE_NOT_FOUND(1006, HttpStatus.NOT_FOUND, "Role is not existed"),
        ROLE_NOT_ASSIGNABLE(1007, HttpStatus.FORBIDDEN, "This system cannot be assigned a role"),
        INVALID_CREDENTIALS(1008, HttpStatus.UNAUTHORIZED, "Invalid email or password."),
        INVALID_TOKEN(1009, HttpStatus.UNAUTHORIZED, "Invalid token"),
        REFRESH_TOKEN_EXPIRED(1010, HttpStatus.UNAUTHORIZED, "Refresh token is expired"),
        CAN_NOT_CREATE_TOKEN(1011, HttpStatus.BAD_REQUEST, "Can not create token"),
        ;

        int code;
        HttpStatus status;
        String message;
}
