package com.pos.backend.constant.enums;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum CommonRole {
    ADMIN("Admin / Owner", true),
    SUPERVISOR("Supervisor", false),
    CASHIER("Cashier", false),
    CHEF("Chef", false),
    WAITER("Waiter", false),
    DELIVERY("Delivery", false),
    ACCOUNTANT("Accountant", false),
    SYSTEM_OPERATOR("System Operator", false);

    String dbName;
    boolean systemRole;
}
