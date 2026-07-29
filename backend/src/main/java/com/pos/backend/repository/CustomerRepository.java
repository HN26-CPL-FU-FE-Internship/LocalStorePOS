package com.pos.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("""
                SELECT c FROM Customer c
                WHERE (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:status IS NULL OR c.status = :status)
            """)
    Page<Customer> search(
            @Param("search") String search,
            @Param("status") CommonStatus status,
            Pageable pageable);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);
}
