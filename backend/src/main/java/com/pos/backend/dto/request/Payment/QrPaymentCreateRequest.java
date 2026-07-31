package com.pos.backend.dto.request.Payment;

import java.math.BigDecimal;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class QrPaymentCreateRequest {

    @PositiveOrZero
    private BigDecimal discountAmount;

    private String discountType;

    @PositiveOrZero
    private BigDecimal tipAmount;

    private String couponCode;

    private String note;
}
