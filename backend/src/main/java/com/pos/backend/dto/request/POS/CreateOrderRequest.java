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
public class CreateOrderRequest {
    private String orderType;
    private Long customerId;
    private Long waiterId;
    private Long tableId;
    private BigDecimal subtotal;
    private BigDecimal vatAmount;
    private BigDecimal serviceTaxAmount;
    private BigDecimal grandTotal;
    private String note;
    private List<CreateOrderItemRequest> items;
}
