package com.pos.backend.repository;

import com.pos.backend.entity.Order;
import com.pos.backend.service.Kitchen.KitchenStatusCount;
import com.pos.backend.service.Order.OrderStatusCount;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    boolean existsByTableId(Long tableId);

    /**
     * Count orders on a table that are still in progress (i.e. not finished
     * or cancelled) — used to decide whether a table can be released.
     */
    long countByTableIdAndStatusNotIn(Long tableId,
            java.util.Collection<com.pos.backend.constant.enums.OrderStatus> statuses);

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
            AND o.status = :completedStatus
            AND o.paymentStatus = :paidStatus
            ORDER BY o.orderedAt DESC
            """)
    List<Order> findCompletedOrdersInRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus,
            @Param("paidStatus") com.pos.backend.constant.enums.OrderPaymentStatus paidStatus);

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
            AND o.status = :completedStatus
            GROUP BY c.id, c.name, c.avatarPath
            ORDER BY totalOrders DESC
            """)
    List<Object[]> findCustomerSalesInRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus);

    @EntityGraph(attributePaths = { "table", "customer", "waiter" })
    Optional<Order> findById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = { "table", "customer", "waiter" })
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = { "table", "customer", "waiter" })
    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("""
                SELECT COUNT(o) FROM Order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
            """)
    long countOrdersBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("""
                SELECT COUNT(o) FROM Order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = :completedStatus
                AND o.paymentStatus = :paidStatus
            """)
    long countCompletedPaidOrdersBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus,
            @Param("paidStatus") com.pos.backend.constant.enums.OrderPaymentStatus paidStatus);

    @Query("""
                SELECT COALESCE(SUM(o.grandTotal), 0) FROM Order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = :completedStatus
                AND o.paymentStatus = :paidStatus
            """)
    BigDecimal sumGrandTotalBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus,
            @Param("paidStatus") com.pos.backend.constant.enums.OrderPaymentStatus paidStatus);

    @Query("""
                SELECT FUNCTION('DATE', o.orderedAt), COALESCE(SUM(o.grandTotal), 0)
                FROM Order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = :completedStatus
                AND o.paymentStatus = :paidStatus
                GROUP BY FUNCTION('DATE', o.orderedAt)
                ORDER BY FUNCTION('DATE', o.orderedAt) ASC
            """)
    List<Object[]> getRevenueByDateBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus,
            @Param("paidStatus") com.pos.backend.constant.enums.OrderPaymentStatus paidStatus);

    @Query("""
                SELECT o FROM Order o
                LEFT JOIN FETCH o.customer
                LEFT JOIN FETCH o.table
                WHERE o.status NOT IN (:inactiveStatuses)
                ORDER BY o.orderedAt DESC
            """)
    List<Order> findActiveOrders(Pageable pageable,
            @Param("inactiveStatuses") List<com.pos.backend.constant.enums.OrderStatus> inactiveStatuses);

    @Query("""
                SELECT
                    u.firstName,
                    u.lastName,
                    u.avatarPath,
                    COALESCE(SUM(o.grandTotal), 0)
                FROM Order o
                JOIN o.waiter u
                WHERE o.waiter IS NOT NULL
                AND o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = :completedStatus
                GROUP BY u.id, u.firstName, u.lastName, u.avatarPath
                ORDER BY SUM(o.grandTotal) DESC
            """)
    Page<Object[]> findTopUserBySalesInRange(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("completedStatus") com.pos.backend.constant.enums.OrderStatus completedStatus,
            Pageable pageable);
}
