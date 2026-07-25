package com.pos.backend.dto.request.POS;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderItemAddonRequest {
    private Long addonId;
    private String addonName;
    private BigDecimal addonPrice;
    private Integer quantity;
}
