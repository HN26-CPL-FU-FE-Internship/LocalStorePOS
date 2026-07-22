package com.pos.backend.dto.request.POS;

import java.math.BigDecimal;
import java.util.List;

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
public class CreateOrderItemRequest {
    private Long itemId;
    private Long variationId;
    private String itemName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
    private String kitchenNote;
    private List<CreateOrderItemAddonRequest> addons;
}
