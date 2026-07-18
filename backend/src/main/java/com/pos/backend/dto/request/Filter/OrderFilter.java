package com.pos.backend.dto.request.Filter;

import com.pos.backend.constant.enums.OrderStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderFilter extends DateFilter {

    private OrderStatus status;
    private String orderNumber;
}
