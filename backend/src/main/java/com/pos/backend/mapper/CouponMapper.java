package com.pos.backend.mapper;

import org.mapstruct.Mapper;

import com.pos.backend.dto.response.Coupon.CouponResponse;
import com.pos.backend.entity.Coupon;

@Mapper(componentModel = "spring")
public interface CouponMapper {
    
    CouponResponse toCouponResponse(Coupon coupon);
}
