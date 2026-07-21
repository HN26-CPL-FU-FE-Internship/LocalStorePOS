package com.pos.backend.util;

import java.util.Map;
import java.util.Set;

import com.pos.backend.constant.enums.OrderStatus;

public class OrderUtil {

    public static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.pending, Set.of(OrderStatus.preparing, OrderStatus.cancelled),
            OrderStatus.preparing, Set.of(OrderStatus.served, OrderStatus.delivered, OrderStatus.cancelled),
            OrderStatus.served, Set.of(
                    OrderStatus.completed),
            OrderStatus.delivered, Set.of(OrderStatus.completed),
            OrderStatus.completed, Set.of(),
            OrderStatus.cancelled, Set.of());
}
