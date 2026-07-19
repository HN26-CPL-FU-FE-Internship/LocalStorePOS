package com.pos.backend.controller.Coupon;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.dto.request.Coupon.CouponRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Coupon.CouponListItemResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Coupon.CouponService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public ApiResponse<PageResponse<CouponListItemResponse>> getCoupons(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CouponStatus status) {

        PageResponse<CouponListItemResponse> response = couponService.getCoupons(
                page, size, sortBy, sortDir, search, status);

        return ApiResponse.<PageResponse<CouponListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CouponListItemResponse> getCoupon(@PathVariable Long id) {
        return ApiResponse.<CouponListItemResponse>builder()
                .message("Success")
                .result(couponService.getCoupon(id))
                .build();
    }

    @PostMapping
    public ApiResponse<CouponListItemResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.<CouponListItemResponse>builder()
                .message("Coupon created successfully")
                .result(couponService.createCoupon(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CouponListItemResponse> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {

        return ApiResponse.<CouponListItemResponse>builder()
                .message("Coupon updated successfully")
                .result(couponService.updateCoupon(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<CouponListItemResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam CouponStatus status) {

        return ApiResponse.<CouponListItemResponse>builder()
                .message("Coupon status updated successfully")
                .result(couponService.updateStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);

        return ApiResponse.<Void>builder()
                .message("Coupon deleted successfully")
                .build();
    }
}
