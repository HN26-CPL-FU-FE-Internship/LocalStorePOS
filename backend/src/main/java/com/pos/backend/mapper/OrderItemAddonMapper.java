package com.pos.backend.mapper;

import org.mapstruct.Mapper;

import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.OrderItemAddon;

@Mapper(componentModel = "spring")
public interface OrderItemAddonMapper {

    OrderItemAddonResponse toOrderItemAddonResponse(OrderItemAddon orderItemAddon);
}
