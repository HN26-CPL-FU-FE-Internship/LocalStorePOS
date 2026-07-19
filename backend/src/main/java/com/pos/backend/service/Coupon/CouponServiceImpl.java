package com.pos.backend.service.Coupon;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.dto.request.Coupon.CouponRequest;
import com.pos.backend.dto.response.Coupon.CouponListItemResponse;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Coupon;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.CouponRepository;
import com.pos.backend.service.Common.PageResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CouponListItemResponse> getCoupons(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CouponStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Coupon> couponPage = status == CouponStatus.expired
                ? couponRepository.searchExpired(normalizedSearch, LocalDate.now(), pageable)
                : couponRepository.search(normalizedSearch, status, pageable);

        List<CouponListItemResponse> coupons = couponPage.getContent().stream().map(this::toResponse).toList();

        return PageResponse.<CouponListItemResponse>builder()
                .items(coupons)
                .page(page)
                .size(size)
                .totalElements(couponPage.getTotalElements())
                .totalPages(couponPage.getTotalPages())
                .first(couponPage.isFirst())
                .last(couponPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CouponListItemResponse getCoupon(Long id) {
        return toResponse(findCouponOrThrow(id));
    }

    @Override
    @Transactional
    public CouponListItemResponse createCoupon(CouponRequest request) {
        validateDateRange(request);

        if (couponRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }

        Set<Category> categories = resolveCategories(request.getCategoryIds());

        Coupon coupon = Coupon.builder()
                .code(request.getCode().trim().toUpperCase())
                .discountType(request.getDiscountType())
                .discountAmount(request.getDiscountAmount())
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .status(request.getStatus() != null ? request.getStatus() : CouponStatus.active)
                .categories(categories)
                .build();

        coupon = couponRepository.save(coupon);

        return toResponse(coupon);
    }

    @Override
    @Transactional
    public CouponListItemResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = findCouponOrThrow(id);
        validateDateRange(request);

        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }

        coupon.setCode(code);
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountAmount(request.getDiscountAmount());
        coupon.setStartDate(request.getStartDate());
        coupon.setExpiryDate(request.getExpiryDate());
        coupon.setCategories(resolveCategories(request.getCategoryIds()));

        if (request.getStatus() != null) {
            coupon.setStatus(request.getStatus());
        }

        coupon = couponRepository.save(coupon);

        return toResponse(coupon);
    }

    @Override
    @Transactional
    public CouponListItemResponse updateStatus(Long id, CouponStatus status) {
        Coupon coupon = findCouponOrThrow(id);
        coupon.setStatus(status);
        coupon = couponRepository.save(coupon);
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = findCouponOrThrow(id);
        couponRepository.delete(coupon);
    }

    private Coupon findCouponOrThrow(Long id) {
        return couponRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
    }

    private void validateDateRange(CouponRequest request) {
        if (request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new AppException(ErrorCode.INVALID_COUPON_DATE_RANGE);
        }
    }

    private Set<Category> resolveCategories(List<Long> categoryIds) {
        List<Category> categories = categoryRepository.findAllById(categoryIds);

        if (categories.size() != new LinkedHashSet<>(categoryIds).size()) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        return new LinkedHashSet<>(categories);
    }

    /**
     * A coupon flagged "active" whose expiry date has already passed is
     * surfaced as "expired" without mutating the stored status, so an admin
     * re-activating it later doesn't need to fix a status that was
     * silently overwritten by a background job.
     */
    private String resolveEffectiveStatus(Coupon coupon) {
        if (coupon.getStatus() == CouponStatus.active && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            return CouponStatus.expired.name();
        }
        return coupon.getStatus().name();
    }

    private CouponListItemResponse toResponse(Coupon coupon) {
        List<Category> categories = List.copyOf(coupon.getCategories());

        return CouponListItemResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .categoryIds(categories.stream().map(Category::getId).toList())
                .categoryNames(categories.stream().map(Category::getName).toList())
                .discountType(coupon.getDiscountType().name())
                .discountAmount(coupon.getDiscountAmount())
                .startDate(coupon.getStartDate())
                .expiryDate(coupon.getExpiryDate())
                .status(resolveEffectiveStatus(coupon))
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}
