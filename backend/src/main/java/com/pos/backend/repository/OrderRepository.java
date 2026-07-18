package com.pos.backend.repository;

import com.pos.backend.entity.Order;
import com.pos.backend.service.Order.OrderStatusCount;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Query("""
            SELECT
                o.status AS status,
                COUNT(o) AS totalOrder
            FROM Order o
            WHERE (:fromDate IS NULL OR o.orderedAt >= :fromDate)
            AND (:toDate IS NULL OR o.orderedAt <= :toDate)
            GROUP BY o.status

            """)
    List<OrderStatusCount> countOrderByStatus(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Override
    @EntityGraph(attributePaths = { "table" })
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

}
