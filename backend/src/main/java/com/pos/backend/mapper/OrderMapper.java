package com.pos.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.entity.Order;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "tableNumber", source = "table.tableNumber")
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "coupon", ignore = true)
    @Mapping(target = "customerName", ignore = true)
    @Mapping(target = "waiter", ignore = true)
    OrderResponse toOrderResponse(Order order);
}
