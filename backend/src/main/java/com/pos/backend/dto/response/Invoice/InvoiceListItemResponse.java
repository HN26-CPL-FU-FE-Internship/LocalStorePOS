package com.pos.backend.dto.response.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InvoiceListItemResponse {
    private Long id;
    private String invoiceNumber;
    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerAvatarPath;
    private LocalDate invoiceDate;
    private String orderType;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
}
