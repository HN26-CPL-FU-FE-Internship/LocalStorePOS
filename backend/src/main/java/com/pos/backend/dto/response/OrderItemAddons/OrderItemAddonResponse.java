package com.pos.backend.dto.response.OrderItemAddons;

import java.math.BigDecimal;

import lombok.Builder;

@Builder
public record OrderItemAddonResponse(
        Long id,
        String addonName,
        BigDecimal addonPrice,
        Integer quantity) {
}
