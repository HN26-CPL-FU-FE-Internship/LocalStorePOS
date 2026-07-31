package com.pos.backend.repository;

import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.entity.OrderItem;

import java.util.List;

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
     * Returns array of [itemId, count].
     */
    @Query("""
                SELECT oi.item.id AS itemId, COUNT(oi) AS orderCount
                FROM OrderItem oi
                WHERE oi.item.id IN :itemIds
                GROUP BY oi.item.id
            """)
    List<Object[]> countOrderFrequencyByItemIds(@Param("itemIds") List<Long> itemIds);

    @Query("""
            SELECT oi.order.id, COUNT(oi)
            FROM OrderItem oi
            WHERE oi.order.id IN :orderIds
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
            GROUP BY c.id, c.name, o.id
            """)
    List<Object[]> findCategorySalesByOrderIds(@Param("orderIds") List<Long> orderIds);

    @Query("""
                SELECT oi FROM OrderItem oi
                LEFT JOIN FETCH oi.variation v
                WHERE oi.order.id = :orderId
                ORDER BY oi.id ASC
            """)
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);
}
