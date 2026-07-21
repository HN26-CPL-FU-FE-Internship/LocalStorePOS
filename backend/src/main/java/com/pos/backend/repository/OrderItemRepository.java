package com.pos.backend.repository;

import com.pos.backend.entity.OrderItem;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @EntityGraph(attributePaths = { "order", "variation" })
    List<OrderItem> findByOrderIdIn(List<Long> orderIds);
}
