package com.pos.backend.dto.response.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentListItemResponse {
    private Long id;
    private String transactionId;
    private Long orderId;
    private String orderNumber;
    private String tokenNo;
    private Long customerId;
    private String customerName;
    private String customerAvatarPath;
    private String orderType;
    private long itemCount;
    private BigDecimal grandTotal;
    private String paymentMethodName;
    private String status;
    private LocalDateTime paidAt;
}
