package com.pos.backend.dto.response.Report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EarningReportResponse {
    String earningId;
    LocalDateTime date;
    String orderNumber;
    String customerName;
    String orderType;
    String paymentMethod;
    BigDecimal grandTotal;
    String status;
}
