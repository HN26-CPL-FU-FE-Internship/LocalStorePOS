package com.pos.backend.repository;

import com.pos.backend.entity.OrderItem;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @EntityGraph(attributePaths = { "order", "variation" })
    List<OrderItem> findByOrderIdIn(List<Long> orderIds);

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
}
