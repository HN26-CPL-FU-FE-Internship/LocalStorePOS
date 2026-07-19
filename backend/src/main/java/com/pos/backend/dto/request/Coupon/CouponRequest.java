package com.pos.backend.dto.request.Coupon;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.constant.enums.DiscountType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Coupon code must not be blank")
    @Size(max = 50, message = "Coupon code must not exceed 50 characters")
    private String code;

    @NotEmpty(message = "At least one valid category is required")
    private List<Long> categoryIds;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount amount is required")
    @Positive(message = "Discount amount must be greater than 0")
    private BigDecimal discountAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private CouponStatus status;
}
