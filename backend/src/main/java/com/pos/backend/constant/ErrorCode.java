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
        MODULE_NOT_FOUND(1015, HttpStatus.NOT_FOUND, "Permission module is not existed"),
        ROLE_NOT_ASSIGNABLE(1007, HttpStatus.FORBIDDEN, "This system cannot be assigned a role"),
        INVALID_CREDENTIALS(1008, HttpStatus.UNAUTHORIZED, "Invalid email or password."),
        INVALID_TOKEN(1009, HttpStatus.UNAUTHORIZED, "Invalid token"),
        REFRESH_TOKEN_EXPIRED(1010, HttpStatus.UNAUTHORIZED, "Refresh token is expired"),
        CAN_NOT_CREATE_TOKEN(1011, HttpStatus.BAD_REQUEST, "Can not create token"),
        USER_NOT_FOUND(1012, HttpStatus.NOT_FOUND, "User not found"),
        INVALID_AVATAR_FILE(1013, HttpStatus.BAD_REQUEST, "Invalid avatar file"),
        CAN_NOT_UPLOAD_FILE(1014, HttpStatus.INTERNAL_SERVER_ERROR, "Can not upload file"),
        CATEGORY_NOT_FOUND(1015, HttpStatus.NOT_FOUND, "Category not found"),
        CATEGORY_NAME_ALREADY_EXISTS(1016, HttpStatus.BAD_REQUEST, "Category name already exists"),
        CATEGORY_HAS_ITEMS(1017, HttpStatus.BAD_REQUEST, "Cannot delete category that still has items"),
        INVALID_IMAGE_FILE(1018, HttpStatus.BAD_REQUEST, "Invalid image file"),
        IMAGE_TOO_LARGE(1019, HttpStatus.BAD_REQUEST, "Image must not exceed 5 MB"),
        FILE_UPLOAD_FAILED(1020, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file"),
        ORDER_NOT_FOUND(1021, HttpStatus.NOT_FOUND, "Can not find order"),
        ORDER_HAS_BEEN_DELIVERED(1022, HttpStatus.BAD_REQUEST, "Order has been delivered"),
        ORDER_HAS_BEEN_SERVED(1023, HttpStatus.BAD_REQUEST, "Order has been served"),
        INVALID_ORDER_STATUS_TRANSITION(1024, HttpStatus.BAD_REQUEST, "Invalid order status transition"),
        ;

        int code;
        HttpStatus status;
        String message;
}
