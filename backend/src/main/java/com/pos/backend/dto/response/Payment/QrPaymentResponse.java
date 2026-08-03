package com.pos.backend.dto.response.Payment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPaymentResponse {
    private String paymentCode;
    private BigDecimal amount;
    private String qrContent;
    private OffsetDateTime expiresAt;
}
