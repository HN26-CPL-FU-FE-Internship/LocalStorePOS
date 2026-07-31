package com.pos.backend.dto.response.Payment;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPaymentConfirmResponse {
    private String status;
    private String message;
    private String paymentCode;
    private BigDecimal amount;
    private String orderNumber;
    private String merchantName;
}
