package com.pos.backend.dto.response.Coupon;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CouponListItemResponse {
    private Long id;
    private String code;
    private List<Long> categoryIds;
    private List<String> categoryNames;
    private String discountType;
    private BigDecimal discountAmount;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
