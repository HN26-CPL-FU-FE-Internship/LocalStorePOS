package com.pos.backend.service.Coupon;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.dto.request.Coupon.CouponRequest;
import com.pos.backend.dto.response.Coupon.CouponListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface CouponService {

    PageResponse<CouponListItemResponse> getCoupons(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CouponStatus status);

    CouponListItemResponse getCoupon(Long id);

    CouponListItemResponse createCoupon(CouponRequest request);

    CouponListItemResponse updateCoupon(Long id, CouponRequest request);

    CouponListItemResponse updateStatus(Long id, CouponStatus status);

    void deleteCoupon(Long id);
}
