package com.pos.backend.dto.request.Filter;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderFilter extends DateFilter {

    private OrderStatus status;
    private KitchenStatus kitchenStatus;
    private String orderNumber;
    private String tableNumber;

    /**
     * Free-text search used by the kitchen screen; matches order number,
     * token number or table number.
     */
    private String search;
}
