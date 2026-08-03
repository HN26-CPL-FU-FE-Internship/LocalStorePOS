package com.pos.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.entity.Payment;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
                SELECT p FROM Payment p
                JOIN FETCH p.order o
                JOIN FETCH p.paymentMethod pm
                LEFT JOIN FETCH o.customer c
                WHERE (:search IS NULL OR LOWER(p.transactionId) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:status IS NULL OR p.status = :status)
            """)
    Page<Payment> search(
            @Param("search") String search,
            @Param("status") PaymentStatus status,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH p.paymentMethod pm WHERE p.paymentCode = :paymentCode")
    Optional<Payment> findByPaymentCodeForUpdate(@Param("paymentCode") String paymentCode);

    @Modifying
    @Query("""
            UPDATE Payment p
            SET p.status = com.pos.backend.constant.enums.PaymentStatus.failed
            WHERE p.order.id = :orderId
              AND p.paymentCode IS NOT NULL
              AND p.status = com.pos.backend.constant.enums.PaymentStatus.pending
            """)
    int invalidatePendingQrPayments(@Param("orderId") Long orderId);
}
