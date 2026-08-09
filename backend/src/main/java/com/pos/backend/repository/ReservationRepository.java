package com.pos.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    boolean existsByTableId(Long tableId);

    @Query("""
            SELECT r FROM Reservation r
            LEFT JOIN FETCH r.customer
            LEFT JOIN FETCH r.table
            WHERE (:tableId IS NULL OR r.table.id = :tableId)
              AND (:status   IS NULL OR r.status   = :status)
            ORDER BY r.reservationTime ASC
            """)
    List<Reservation> search(
            @Param("tableId") Long tableId,
            @Param("status")  ReservationStatus status);

    @Query("""
                SELECT COUNT(r) FROM Reservation r
                WHERE r.reservationTime >= :fromDate
                AND r.reservationTime <= :toDate
            """)
    long countReservationsBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("""
                SELECT r FROM Reservation r
                LEFT JOIN FETCH r.customer
                LEFT JOIN FETCH r.table
                WHERE r.reservationTime >= :fromDate
                AND r.reservationTime <= :toDate
                ORDER BY r.reservationTime ASC
            """)
    List<Reservation> findUpcomingReservationsBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate, Pageable pageable);
}

