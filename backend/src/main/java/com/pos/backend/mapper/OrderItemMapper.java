package com.pos.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.entity.OrderItem;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    @Mapping(target = "addons", ignore = true)
    OrderItemResponse tOrderItemResponse(OrderItem orderItem);
}
