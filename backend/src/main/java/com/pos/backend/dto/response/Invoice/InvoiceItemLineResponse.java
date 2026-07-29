package com.pos.backend.dto.response.Invoice;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InvoiceItemLineResponse {
    private String itemName;
    private String variationName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
