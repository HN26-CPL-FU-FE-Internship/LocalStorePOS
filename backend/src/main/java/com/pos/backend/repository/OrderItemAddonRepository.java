package com.pos.backend.repository;

import com.pos.backend.entity.OrderItemAddon;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemAddonRepository extends JpaRepository<OrderItemAddon, Long> {

    @EntityGraph(attributePaths = { "orderItem" })
    List<OrderItemAddon> findByOrderItemIdIn(List<Long> orderItemIds);
}
