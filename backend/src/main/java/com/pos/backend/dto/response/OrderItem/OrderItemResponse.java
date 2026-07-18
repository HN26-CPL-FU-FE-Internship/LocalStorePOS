package com.pos.backend.dto.response.OrderItem;

import java.util.List;

import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;

import lombok.Builder;

@Builder
public record OrderItemResponse(
        Long id,
        String itemName,
        Integer quantity,
        String kitchenNote,
        String sizeName,
        List<OrderItemAddonResponse> addons) {

}
