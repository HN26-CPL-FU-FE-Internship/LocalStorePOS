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
    CATEGORY_NOT_FOUND(1043, HttpStatus.NOT_FOUND, "Category not found"),
    CATEGORY_NAME_ALREADY_EXISTS(1016, HttpStatus.BAD_REQUEST, "Category name already exists"),
    CATEGORY_HAS_ITEMS(1017, HttpStatus.BAD_REQUEST, "Cannot delete category that still has items"),
    INVALID_IMAGE_FILE(1018, HttpStatus.BAD_REQUEST, "Invalid image file"),
    IMAGE_TOO_LARGE(1019, HttpStatus.BAD_REQUEST, "Image must not exceed 5 MB"),
    FILE_UPLOAD_FAILED(1020, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file"),
    ORDER_NOT_FOUND(1021, HttpStatus.NOT_FOUND, "Can not find order"),
    ORDER_HAS_BEEN_DELIVERED(1022, HttpStatus.BAD_REQUEST, "Order has been delivered"),
    ORDER_HAS_BEEN_SERVED(1023, HttpStatus.BAD_REQUEST, "Order has been served"),
    INVALID_ORDER_STATUS_TRANSITION(1024, HttpStatus.BAD_REQUEST, "Invalid order status transition"),
    USER_INACTIVE(1025, HttpStatus.FORBIDDEN, "Your account has been deactivated. Please contact administrator."),
    ITEM_NOT_FOUND(1026, HttpStatus.NOT_FOUND, "Item not found"),
    TAX_NOT_FOUND(1027, HttpStatus.NOT_FOUND, "Tax not found"),
    INVALID_VARIATION_OR_ADDON_DATA(1028, HttpStatus.BAD_REQUEST, "Invalid variation or addon data"),

    ADDON_NOT_FOUND(1029, HttpStatus.NOT_FOUND, "Addon not found"),

    COUPON_NOT_FOUND(1030, HttpStatus.NOT_FOUND, "Coupon not found"),
    COUPON_CODE_ALREADY_EXISTS(1031, HttpStatus.BAD_REQUEST, "Coupon code already exists"),
    INVALID_COUPON_DATE_RANGE(1032, HttpStatus.BAD_REQUEST, "Expiry date must not be before start date"),

    ORDER_ALREADY_COMPLETED_OR_CANCELLED(1033, HttpStatus.BAD_REQUEST, "Order is already completed or cancelled"),
    INSUFFICIENT_PAYMENT(1034, HttpStatus.BAD_REQUEST, "Given amount must be at least the final total"),
    ZERO_TOTAL(1035, HttpStatus.BAD_REQUEST,
            "Order total cannot be zero. Please adjust discount or coupon before payment."),
    TABLE_NOT_FOUND(1036, HttpStatus.NOT_FOUND, "Table not found."),
    NO_TABLE_CHOOSE_FOR_DINE_IN(1037, HttpStatus.BAD_REQUEST, "haven't selected a table for dine in yet."),
    NO_WAITER_CHOOSE_FOR_DINE_IN(1038, HttpStatus.BAD_REQUEST, "haven't selected a waiter for dine in yet."),
    CUSTOMER_NOT_FOUND(1039, HttpStatus.NOT_FOUND, "Customer not found."),
    WAITER_NOT_FOUND(1040, HttpStatus.NOT_FOUND, "Waiter not found."),

    CUSTOMER_PHONE_ALREADY_EXISTS(1041, HttpStatus.BAD_REQUEST, "Phone number already exists"),

    TABLE_AREA_NOT_FOUND(1042, HttpStatus.NOT_FOUND, "Table area not found"),
    TABLE_AREA_NAME_ALREADY_EXISTS(1057, HttpStatus.BAD_REQUEST, "Table area name already exists"),
    RESTAURANT_TABLE_NOT_FOUND(1044, HttpStatus.NOT_FOUND, "Table not found"),
    TABLE_NUMBER_ALREADY_EXISTS(1045, HttpStatus.BAD_REQUEST, "Table number already exists"),
    TABLE_NOT_AVAILABLE(1046, HttpStatus.BAD_REQUEST, "Table is not available"),

    RESERVATION_NOT_FOUND(1047, HttpStatus.NOT_FOUND, "Reservation not found"),

    INVOICE_NOT_FOUND(1058, HttpStatus.NOT_FOUND, "Invoice not found"),
    ORDER_CANNOT_BE_EDITED(1059, HttpStatus.BAD_REQUEST, "Only unpaid pending orders can be edited."),
    APPROVAL_REQUEST_NOT_FOUND(1060, HttpStatus.NOT_FOUND, "Approval request not found"),
    APPROVAL_REQUEST_ALREADY_RESOLVED(1048, HttpStatus.BAD_REQUEST, "Approval request has already been resolved"),
    APPROVAL_REQUEST_ALREADY_EXISTS(1050, HttpStatus.BAD_REQUEST,
            "A pending approval request already exists for this action"),
    CANNOT_RESOLVE_OWN_REQUEST(1055, HttpStatus.BAD_REQUEST,
            "You cannot approve or reject your own request"),
    APPROVAL_DATA_INVALID(1056, HttpStatus.BAD_REQUEST,
            "Approval request data is missing or invalid"),
    NOTIFICATION_NOT_FOUND(1049, HttpStatus.NOT_FOUND, "Notification not found"),

    PAYMENT_NOT_FOUND(1061, HttpStatus.NOT_FOUND, "Payment not found"),
    PAYMENT_ALREADY_PROCESSED(1051, HttpStatus.BAD_REQUEST, "Payment has already been processed or cancelled"),
    PAYMENT_EXPIRED(1054, HttpStatus.BAD_REQUEST, "Payment QR code has expired"),
    INVALID_PAYMENT_AMOUNT(1052, HttpStatus.BAD_REQUEST, "Invalid payment amount"),
    ORDER_NOT_ELIGIBLE_FOR_QR(1053, HttpStatus.BAD_REQUEST, "Order is not eligible for QR payment"),
    ;

    int code;
    HttpStatus status;
    String message;
}
