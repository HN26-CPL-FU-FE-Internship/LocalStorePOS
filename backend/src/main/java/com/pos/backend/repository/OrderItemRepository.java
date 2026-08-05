package com.pos.backend.repository;

import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.entity.OrderItem;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @EntityGraph(attributePaths = { "order", "variation" })
    List<OrderItem> findByOrderIdIn(List<Long> orderIds);

    @EntityGraph(attributePaths = { "order", "variation" })
    List<OrderItem> findByOrderId(Long id);

    /**
     * Count how many times each item has been ordered (by item_id).
     * Returns array of [itemId, count]. Cancelled items are excluded.
     */
    @Query("""
                SELECT oi.item.id AS itemId, COUNT(oi) AS orderCount
                FROM OrderItem oi
                WHERE oi.item.id IN :itemIds
                AND oi.status <> 'cancelled'
                GROUP BY oi.item.id
            """)
    List<Object[]> countOrderFrequencyByItemIds(@Param("itemIds") List<Long> itemIds);

    @Query("""
            SELECT oi.order.id, COUNT(oi)
            FROM OrderItem oi
            WHERE oi.order.id IN :orderIds
            AND oi.status <> 'cancelled'
            GROUP BY oi.order.id
            """)
    List<Object[]> countItemsByOrderIds(@Param("orderIds") List<Long> orderIds);

    @Query("""
            SELECT
                c.id AS categoryId,
                c.name AS categoryName,
                SUM(oi.quantity) AS itemsSold,
                o.id AS orderId,
                SUM(oi.lineTotal) AS grandTotal
            FROM OrderItem oi
            JOIN oi.item i
            JOIN i.category c
            JOIN oi.order o
            WHERE oi.order.id IN :orderIds
            AND oi.status <> 'cancelled'
            GROUP BY c.id, c.name, o.id
            """)
    List<Object[]> findCategorySalesByOrderIds(@Param("orderIds") List<Long> orderIds);

    @Modifying
    @Query("""
                UPDATE OrderItem oi
                SET oi.status = :status
                WHERE oi.order.id = :orderId
                AND oi.status <> 'cancelled'
            """)
    void updateStatusByOrderId(Long orderId, OrderItemStatus status);

    // @Query("""
    // SELECT oi FROM OrderItem oi
    // LEFT JOIN FETCH oi.variation v
    // WHERE oi.order.id = :orderId
    // ORDER BY oi.id ASC
    // """)
    // List<OrderItem> findByOrderId(@Param("orderId") Long orderId);

    @Query("""
                SELECT oi.item.id, oi.itemName, i.imagePath, SUM(oi.quantity)
                FROM OrderItem oi
                JOIN oi.item i
                JOIN oi.order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = 'completed'
                AND oi.status <> 'cancelled'
                GROUP BY oi.item.id, oi.itemName, i.imagePath
                ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> findTopSellingItemsBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate, Pageable pageable);

    @Query("""
                SELECT c.name, COUNT(DISTINCT o.id), SUM(oi.quantity)
                FROM OrderItem oi
                JOIN oi.item i
                JOIN i.category c
                JOIN oi.order o
                WHERE o.orderedAt >= :fromDate
                AND o.orderedAt <= :toDate
                AND o.status = 'completed'
                AND oi.status <> 'cancelled'
                GROUP BY c.id, c.name
                ORDER BY COUNT(DISTINCT o.id) DESC
            """)
    List<Object[]> findCategoryStatsBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("""
                SELECT i.id, i.name, i.imagePath, i.foodType, COALESCE(SUM(oi.quantity), 0)
                FROM Item i
                LEFT JOIN OrderItem oi ON oi.item.id = i.id AND oi.status <> 'cancelled'
                LEFT JOIN oi.order o
                WHERE (o IS NULL OR (o.orderedAt >= :fromDate AND o.orderedAt <= :toDate))
                GROUP BY i.id, i.name, i.imagePath, i.foodType
                ORDER BY COALESCE(SUM(oi.quantity), 0) DESC
            """)
    List<Object[]> findTrendingMenusBetween(@Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate, Pageable pageable);
}
