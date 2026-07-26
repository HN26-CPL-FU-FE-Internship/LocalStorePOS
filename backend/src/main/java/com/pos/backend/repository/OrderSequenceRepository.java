package com.pos.backend.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.entity.OrderSequence;

import jakarta.persistence.LockModeType;

public interface OrderSequenceRepository extends JpaRepository<OrderSequence, LocalDate> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
                SELECT s
                FROM OrderSequence s
                WHERE s.sequenceDate = :date
            """)
    Optional<OrderSequence> findBySequenceDateForUpdate(@Param("date") LocalDate date);
}
