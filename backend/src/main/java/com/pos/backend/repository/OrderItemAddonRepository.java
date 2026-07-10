package com.pos.backend.repository;

import com.pos.backend.entity.OrderItemAddon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemAddonRepository extends JpaRepository<OrderItemAddon, Long> {
}
