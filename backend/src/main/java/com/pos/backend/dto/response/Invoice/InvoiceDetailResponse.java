package com.pos.backend.dto.response.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InvoiceDetailResponse {
    private Long id;
    private String invoiceNumber;
    private Long orderId;
    private String orderNumber;
    private String orderType;
    private String tableNumber;

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerAvatarPath;

    private LocalDate invoiceDate;
    private String status;

    private List<InvoiceItemLineResponse> items;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal serviceCharge;
    private BigDecimal deliveryCharge;
    private BigDecimal tipAmount;
    private BigDecimal grandTotal;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String paymentStatus;

    private LocalDateTime createdAt;
}
