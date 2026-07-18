package com.pos.backend.repository;

import com.pos.backend.entity.OrderRefund;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRefundRepository extends JpaRepository<OrderRefund, Long> {
}
