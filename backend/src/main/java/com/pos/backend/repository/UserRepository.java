package com.pos.backend.repository;

import com.pos.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query("""
                SELECT u
                FROM User u
                JOIN FETCH u.role
                WHERE u.email = :email
            """)
    Optional<User> findByEmailWithRole(String email);

    long countByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate);

    Page<User> findByCreatedAtBetween(LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

    @Query("""
                SELECT FUNCTION('DATE', u.createdAt), COUNT(u)
                FROM User u
                WHERE u.createdAt >= :fromDate
                AND u.createdAt <= :toDate
                GROUP BY FUNCTION('DATE', u.createdAt)
                ORDER BY FUNCTION('DATE', u.createdAt) ASC
            """)
    List<Object[]> countUsersGroupedByDate(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}
