package com.pos.backend.repository;

import com.pos.backend.entity.HeldOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeldOrderRepository extends JpaRepository<HeldOrder, Long> {
}
