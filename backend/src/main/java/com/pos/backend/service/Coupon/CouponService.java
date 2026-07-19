package com.pos.backend.service.Coupon;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.dto.response.Coupon.CouponResponse;
import com.pos.backend.entity.Coupon;
import com.pos.backend.mapper.CouponMapper;
import com.pos.backend.repository.CouponRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CouponService {
    
    CouponRepository couponRepository;
    CouponMapper couponMapper;
    public List<CouponResponse> getActiveCoupons() {
        
        List<Coupon> coupons = couponRepository.findByStatus(CouponStatus.active);

        return coupons.stream().map(coupon -> couponMapper.toCouponResponse(coupon)).toList();
    }
}
