package com.pos.backend.controller.Coupon;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Coupon.CouponResponse;
import com.pos.backend.service.Coupon.CouponService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CouponController {
    
    CouponService couponService;

    @GetMapping("/coupons-list")
    public ApiResponse<List<CouponResponse>> getActiveCoupons() {
        List<CouponResponse> responses = couponService.getActiveCoupons();

        return ApiResponse.<List<CouponResponse>>builder()
        .message("Success")
        .result(responses)
        .build();
    }
    
}
