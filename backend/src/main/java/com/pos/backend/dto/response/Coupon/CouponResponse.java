package com.pos.backend.dto.response.Coupon;

import java.math.BigDecimal;

import com.pos.backend.constant.enums.DiscountType;

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
public class CouponResponse {
    
    String code;
    BigDecimal discountAmount;
    DiscountType discountType;
}
