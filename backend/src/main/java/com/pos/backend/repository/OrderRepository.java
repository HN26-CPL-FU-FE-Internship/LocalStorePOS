package com.pos.backend.repository;

import com.pos.backend.entity.Order;
import com.pos.backend.service.Kitchen.KitchenStatusCount;
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
        @EntityGraph(attributePaths = { "table", "coupon" })
        Page<Order> findAll(Specification<Order> spec, Pageable pageable);

        @EntityGraph(attributePaths = { "customer", "table" })
        Page<Order> findAll(Pageable pageable);

        @Query("""
                        SELECT
                        o.kitchenStatus as kitchenStatus,
                        COUNT(o) as totalOrder
                        FROM Order o
                        GROUP BY o.kitchenStatus
                        """)
        List<KitchenStatusCount> countOrderByKitchenStatus();

        @Query("""
                        SELECT o FROM Order o
                        LEFT JOIN FETCH o.customer
                        WHERE o.orderedAt >= :fromDate
                        AND o.orderedAt <= :toDate
                        AND o.status = 'completed'
                        AND o.paymentStatus = 'paid'
                        ORDER BY o.orderedAt DESC
                        """)
        List<Order> findCompletedOrdersInRange(
                        @Param("fromDate") LocalDateTime fromDate,
                        @Param("toDate") LocalDateTime toDate);

        @Query("""
                        SELECT o FROM Order o
                        LEFT JOIN FETCH o.customer
                        WHERE o.orderedAt >= :fromDate
                        AND o.orderedAt <= :toDate
                        ORDER BY o.orderedAt DESC
                        """)
        List<Order> findOrdersInRange(
                        @Param("fromDate") LocalDateTime fromDate,
                        @Param("toDate") LocalDateTime toDate);

        @Query("""
                        SELECT
                            c.id AS customerId,
                            COALESCE(c.name, 'Walk-in Customer') AS customerName,
                            c.avatarPath AS avatar,
                            COUNT(DISTINCT o.id) AS totalOrders,
                            COALESCE(SUM(o.grandTotal), 0) AS grandTotal
                        FROM Order o
                        LEFT JOIN Customer c ON o.customer.id = c.id
                        WHERE o.orderedAt >= :fromDate
                        AND o.orderedAt <= :toDate
                        AND o.status = 'completed'
                        GROUP BY c.id, c.name, c.avatarPath
                        ORDER BY totalOrders DESC
                        """)
        List<Object[]> findCustomerSalesInRange(
                        @Param("fromDate") LocalDateTime fromDate,
                        @Param("toDate") LocalDateTime toDate);
}
