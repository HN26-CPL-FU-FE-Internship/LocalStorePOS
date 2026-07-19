package com.pos.backend.repository;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.entity.Coupon;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    List<Coupon> findByStatus(CouponStatus status);
}
