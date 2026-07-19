package com.pos.backend.repository;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.entity.Coupon;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Query("""
                SELECT c FROM Coupon c
                WHERE (:search IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:status IS NULL OR c.status = :status)
            """)
    Page<Coupon> search(
            @Param("search") String search,
            @Param("status") CouponStatus status,
            Pageable pageable);

    @Query("""
                SELECT c FROM Coupon c
                WHERE (:search IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%')))
                AND c.status = com.pos.backend.constant.enums.CouponStatus.active
                AND c.expiryDate < :today
            """)
    Page<Coupon> searchExpired(
            @Param("search") String search,
            @Param("today") LocalDate today,
            Pageable pageable);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
