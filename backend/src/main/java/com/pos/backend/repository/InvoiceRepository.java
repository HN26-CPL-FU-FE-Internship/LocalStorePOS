package com.pos.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.InvoiceStatus;
import com.pos.backend.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("""
                SELECT i FROM Invoice i
                JOIN FETCH i.order o
                LEFT JOIN FETCH i.customer c
                WHERE (:search IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:status IS NULL OR i.status = :status)
            """)
    Page<Invoice> search(
            @Param("search") String search,
            @Param("status") InvoiceStatus status,
            Pageable pageable);
}
