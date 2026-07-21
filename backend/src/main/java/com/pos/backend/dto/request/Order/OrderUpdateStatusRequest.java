package com.pos.backend.dto.request.Order;

import com.pos.backend.constant.enums.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderUpdateStatusRequest {
    private OrderStatus status;
}
